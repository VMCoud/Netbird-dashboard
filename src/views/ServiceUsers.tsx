import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "typesafe-actions";
import { actions as userActions } from "../store/user";
import { Container } from "../components/Container";
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Tooltip,
} from "antd";
import { User } from "../store/user/types";
import { filter } from "lodash";
import tableSpin from "../components/Spin";
import { useGetTokenSilently } from "../utils/token";
import { ReloadOutlined } from "@ant-design/icons";
import { actions as groupActions } from "../store/group";
import { capitalize, isLocalDev, isNetBirdHosted } from "../utils/common";
import { usePageSizeHelpers } from "../utils/pageSize";
import AddServiceUserPopup from "../components/popups/AddServiceUserPopup";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { storeFilterState, getFilterState } from "../utils/filterState";

const { Title, Paragraph, Text } = Typography;
const { Column } = Table;

interface UserDataTable extends User {
  key: string;
}

const styleNotification = { marginTop: 85 };

export const ServiceUsers = () => {
  const { onChangePageSize, pageSizeOptions, pageSize } = usePageSizeHelpers();
  const { getTokenSilently } = useGetTokenSilently();
  const dispatch = useDispatch();

  const groups = useSelector((state: RootState) => state.group.data);
  const user = useSelector((state: RootState) => state.user.user);
  const users = useSelector((state: RootState) => state.user.serviceUsers);
  const failed = useSelector((state: RootState) => state.user.failed);
  const loading = useSelector((state: RootState) => state.user.loading);
  const updateUserDrawerVisible = useSelector(
    (state: RootState) => state.user.updateUserDrawerVisible
  );
  const savedUser = useSelector((state: RootState) => state.user.savedUser);
  const deletedUser = useSelector((state: RootState) => state.user.deletedUser);
  const [isRefreshButtonDisabled, setIsRefreshButtonDisabled] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const [confirmModal, confirmModalContextHolder] = Modal.useModal();
  const [textToSearch, setTextToSearch] = useState("");
  const [dataTable, setDataTable] = useState([] as UserDataTable[]);

  const transformDataTable = (d: User[]): UserDataTable[] => {
    return d.map((p) => ({ key: p.id, ...p } as UserDataTable));
  };

  useEffect(() => {
    dispatch(
      userActions.getServiceUsers.request({
        getAccessTokenSilently: getTokenSilently,
        payload: null,
      })
    );
    dispatch(
      groupActions.getGroups.request({
        getAccessTokenSilently: getTokenSilently,
        payload: null,
      })
    );
  }, [savedUser, deletedUser]);

  const fetchData = async () => {
    setIsRefreshButtonDisabled(true);
      dispatch(
        userActions.getUsers.request({
          getAccessTokenSilently: getTokenSilently,
          payload: null,
        })
      );
    dispatch(
      userActions.getServiceUsers.request({
        getAccessTokenSilently: getTokenSilently,
        payload: null,
      })
    );
    dispatch(
      groupActions.getGroups.request({
        getAccessTokenSilently: getTokenSilently,
        payload: null,
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 5000)).then(() =>
      setIsRefreshButtonDisabled(false)
    );
  };
  // useEffect(() => {
  //   setDataTable(transformDataTable(users));
  // }, [users, groups]);

  useEffect(() => {
    if (users.length > 0) {
      setShowTutorial(false);
    } else {
      setShowTutorial(true);
    }
    // setDataTable(transformDataTable(filterDataTable()));
  }, [users]);

  useEffect(() => {
    if (!loading && groups.length) {
      const searchText = getFilterState("serviceUserFilter", "search");
      if (searchText) setTextToSearch(searchText);

      const pageSize = getFilterState("serviceUserFilter", "pageSize");
      if (pageSize) onChangePageSize(pageSize, "serviceUserFilter");
      setDataTable(transformDataTable(filterDataTable(searchText)));
    } else {
      setDataTable(transformDataTable(users));
    }
  }, [loading, groups, users]);

  useEffect(() => {
    setDataTable(transformDataTable(filterDataTable("")));
  }, [textToSearch]);

  const filterDataTable = (searchText: string): User[] => {
    const t = searchText
      ? searchText.toLowerCase().trim()
      : textToSearch.toLowerCase().trim();
    let f: User[] = filter(
      users,
      (f: User) =>
        (f.email || f.id).toLowerCase().includes(t) ||
        f.name.toLowerCase().includes(t) ||
        f.role.includes(t) ||
        t === ""
    ) as User[];
    return f;
  };

  const onChangeTextToSearch = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setTextToSearch(e.target.value);
    storeFilterState("serviceUserFilter", "search", e.target.value);
  };

  const onClickCreateServiceUser = () => {
    dispatch(userActions.setUser(null as unknown as User));
    dispatch(userActions.setAddServiceUserPopupVisible(true));
  };

  const createKey = "saving";
  useEffect(() => {
    if (savedUser.loading) {
      message.loading({
        content: "保存中...",
        key: createKey,
        duration: 0,
        style: styleNotification,
      });
    } else if (savedUser.success) {
      message.success({
        content: "用户已成功保存。",
        key: createKey,
        duration: 2,
        style: styleNotification,
      });
      dispatch(userActions.setUpdateUserDrawerVisible(false));
      dispatch(userActions.setSavedUser({ ...savedUser, success: false }));
      dispatch(userActions.resetSavedUser(null));
    } else if (savedUser.error) {
      let errorMsg = "无法更新用户";
      switch (savedUser.error.statusCode) {
        case 412:
        case 403:
          if (savedUser.error.data) {
            errorMsg = capitalize(savedUser.error.data.message);
          }
          break;
      }
      message.error({
        content: errorMsg,
        key: createKey,
        duration: 5,
        style: styleNotification,
      });
      dispatch(userActions.setSavedUser({ ...savedUser, error: null }));
      dispatch(userActions.resetSavedUser(null));
    }
  }, [savedUser]);

  const handleEditUser = (user: UserDataTable) => {
    dispatch(
      userActions.setUser({
        id: user.id,
        email: user.email,
        role: user.role,
        auto_groups: user.auto_groups ? user.auto_groups : [],
        name: user.name,
        is_current: user.is_current,
        is_service_user: user.is_service_user,
      } as User)
    );
    dispatch(userActions.setEditUserPopupVisible(true));
  };

  const handleDeleteUser = (user: UserDataTable) => {
    confirmModal.confirm({
      icon: <ExclamationCircleOutlined />,
      title: <span className="font-500">删除服务用户 {user.name}</span>,
      width: 500,
      content: (
        <Space direction="vertical" size="small">
          <Paragraph>确定要删除此服务用户吗？</Paragraph>
        </Space>
      ),
      onOk() {
        dispatch(
          userActions.deleteUser.request({
            getAccessTokenSilently: getTokenSilently,
            payload: user.id,
          })
        );
        dispatch(
          userActions.getServiceUsers.request({
            getAccessTokenSilently: getTokenSilently,
            payload: null,
          })
        );
      },
      onCancel() {
        // noop
      },
    });
  };

  return (
    <>
      {!user && (
        <Container style={{ padding: "0px" }}>
          <Row>
            <Col span={24}>
              {users.length ? (
                <Paragraph style={{ marginTop: "5px" }}>
                  使用服务用户创建 API 令牌，避免失去自动访问权限。{" "}
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://docs.netbird.io/how-to/access-netbird-public-api"
                  >
                    {" "}
                    了解更多
                  </a>
                </Paragraph>
              ) : (
                <Paragraph style={{ marginTop: "5px" }} type={"secondary"}>
                  使用服务用户创建 API 令牌，避免失去自动访问权限。{" "}
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://docs.netbird.io/how-to/access-netbird-public-api"
                  >
                    {" "}
                    了解更多
                  </a>
                </Paragraph>
              )}
              <Space
                direction="vertical"
                size="large"
                style={{ display: "flex" }}
              >
                <Row gutter={[16, 24]}>
                  <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={8} span={8}>
                    <Input
                      allowClear
                      value={textToSearch}
                      placeholder="按名称或角色搜索..."
                      onChange={onChangeTextToSearch}
                      disabled={showTutorial}
                    />
                  </Col>
                  <Col
                    xs={24}
                    sm={24}
                    md={11}
                    lg={11}
                    xl={11}
                    xxl={11}
                    span={11}
                  >
                    <Space size="middle">
                      <Select
                        style={{ marginRight: "10px" }}
                        value={pageSize.toString()}
                        options={pageSizeOptions}
                        onChange={(value) => {
                          onChangePageSize(value, "serviceUserFilter");
                        }}
                        className="select-rows-per-page-en"
                        disabled={showTutorial}
                      />
                    </Space>
                    <Tooltip
                      title={
                        isRefreshButtonDisabled
                          ? "您可以在 5 秒内再次刷新"
                          : "刷新"
                      }
                    >
                      <Button
                        onClick={fetchData}
                        disabled={isRefreshButtonDisabled}
                        style={{ marginLeft: "5px", color: "#1890ff" }}
                      >
                        <ReloadOutlined />
                      </Button>
                    </Tooltip>
                  </Col>
                  {!showTutorial && (
                    <Col xs={24} sm={24} md={5} lg={5} xl={5} xxl={5} span={5}>
                      <Row justify="end">
                        <Col>
                          <Button
                            type="primary"
                            onClick={onClickCreateServiceUser}
                          >
                            添加服务用户
                          </Button>
                        </Col>
                      </Row>
                    </Col>
                  )}
                </Row>
                {failed && (
                  <Alert
                    message={failed.message}
                    description={failed.data ? failed.data.message : " "}
                    type="error"
                    showIcon
                    closable
                  />
                )}
                <Card bodyStyle={{ padding: 0 }}>
                  {!showTutorial && (
                    <Table
                      pagination={{
                        pageSize,
                        showSizeChanger: false,
                        showTotal: (total, range) =>
                          `显示 ${range[0]} 至 ${range[1]}，共 ${total} 个服务用户`,
                      }}
                      className="card-table"
                      showSorterTooltip={false}
                      scroll={{ x: true }}
                      loading={tableSpin(loading)}
                      dataSource={dataTable}
                    >
                      <Column
                        title="名称"
                        dataIndex="name"
                        onFilter={(value: string | number | boolean, record) =>
                          (record as any).name.includes(value)
                        }
                        sorter={(a, b) =>
                          (a as any).name.localeCompare((b as any).name)
                        }
                        defaultSortOrder="ascend"
                        render={(text, record, index) => {
                          return (
                            <Button
                              type="text"
                              onClick={() =>
                                handleEditUser(record as UserDataTable)
                              }
                            >
                              <Text className="font-500">
                                {text && text.trim() !== ""
                                  ? text
                                  : (record as User).name}
                              </Text>
                            </Button>
                          );
                        }}
                      />
                      <Column
                        title="状态"
                        dataIndex="status"
                        align="center"
                        onFilter={(value: string | number | boolean, record) =>
                          (record as any).status.includes(value)
                        }
                        sorter={(a, b) =>
                          (a as any).status.localeCompare((b as any).status)
                        }
                        render={(text, record, index) => {
                          if (text === "active") {
                            return <Tag color="green">{text}</Tag>;
                          } else if (text === "invited") {
                            return <Tag color="gold">{text}</Tag>;
                          }
                          return <Tag color="red">{text}</Tag>;
                        }}
                      />
                      <Column
                        title="角色"
                        dataIndex="role"
                        onFilter={(value: string | number | boolean, record) =>
                          (record as any).role.includes(value)
                        }
                        sorter={(a, b) =>
                          (a as any).role.localeCompare((b as any).role)
                        }
                      />
                      <Column
                        title=""
                        align="center"
                        width="250px"
                        render={(text, record, index) => {
                          return (
                            <Button
                              danger={true}
                              type={"text"}
                              style={{ marginLeft: "3px", marginRight: "3px" }}
                              onClick={() => {
                                let userRecord = record as UserDataTable;
                                handleDeleteUser(userRecord);
                              }}
                            >
                              删除
                            </Button>
                          );
                        }}
                      />
                    </Table>
                  )}
                  {showTutorial && (
                    <Space
                      direction="vertical"
                      size="small"
                      align="center"
                      style={{
                        display: "flex",
                        padding: "45px 15px",
                        justifyContent: "center",
                      }}
                    >
                      <Title level={4} style={{ textAlign: "center" }}>
                        创建服务用户
                      </Title>
                      <Paragraph
                        style={{
                          textAlign: "center",
                          whiteSpace: "pre-line",
                        }}
                      >
                        看起来您还没有任何服务用户。{"\n"}
                        通过添加一个服务用户来开始使用您的网络。
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href="https://docs.netbird.io/how-to/access-netbird-public-api"
                        >
                          {" "}
                          了解更多
                        </a>
                      </Paragraph>
                      <Button
                        size={"middle"}
                        type="primary"
                        onClick={() => onClickCreateServiceUser()}
                      >
                        添加服务用户
                      </Button>
                    </Space>
                  )}
                </Card>
              </Space>
            </Col>
          </Row>
        </Container>
      )}
      <AddServiceUserPopup />
      {confirmModalContextHolder}
    </>
  );
};

export default ServiceUsers;
