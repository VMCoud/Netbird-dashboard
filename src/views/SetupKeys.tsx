import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "typesafe-actions";
import { actions as setupKeyActions } from "../store/setup-key";
import { Container } from "../components/Container";
import { ReloadOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  message,
  Modal,
  Popover,
  Radio,
  RadioChangeEvent,
  Row,
  Select,
  Badge,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { SetupKey, SetupKeyToSave } from "../store/setup-key/types";
import { filter } from "lodash";
import { storeFilterState, getFilterState } from "../utils/filterState";
import { formatDate, timeAgo } from "../utils/common";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import SetupKeyNew from "../components/SetupKeyNew";
import SetupKeyEdit from "../components/SetupKeyEdit";
import ButtonCopyMessage from "../components/ButtonCopyMessage";
import tableSpin from "../components/Spin";
import { actions as groupActions } from "../store/group";
import { Group } from "../store/group/types";
import { TooltipPlacement } from "antd/es/tooltip";
import { useGetTokenSilently } from "../utils/token";
import { usePageSizeHelpers } from "../utils/pageSize";
import { UpdateKeyGroupModal } from "../components/UpdateKeyGroupModal";
const { Title, Text, Paragraph } = Typography;
const { Column } = Table;

interface SetupKeyDataTable extends SetupKey {
  key: string;
  groupsCount: number;
}

export const SetupKeys = () => {
  const { onChangePageSize, pageSizeOptions, pageSize } = usePageSizeHelpers();
  const { getTokenSilently } = useGetTokenSilently();
  const dispatch = useDispatch();
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [isRefreshButtonDisabled, setIsRefreshButtonDisabled] = useState(false);

  const setupKeys = useSelector((state: RootState) => state.setupKey.data);
  const failed = useSelector((state: RootState) => state.setupKey.failed);
  const loading = useSelector((state: RootState) => state.setupKey.loading);
  const deletedSetupKey = useSelector(
    (state: RootState) => state.setupKey.deletedSetupKey
  );
  const savedSetupKey = useSelector(
    (state: RootState) => state.setupKey.savedSetupKey
  );
  const groups = useSelector((state: RootState) => state.group.data);

  const [textToSearch, setTextToSearch] = useState("");
  const [optionValidAll, setOptionValidAll] = useState("valid");
  const [dataTable, setDataTable] = useState([] as SetupKeyDataTable[]);
  const setupNewKeyVisible = useSelector(
    (state: RootState) => state.setupKey.setupNewKeyVisible
  );
  const setupEditKeyVisible = useSelector(
    (state: RootState) => state.setupKey.setupEditKeyVisible
  );
  const [groupPopupVisible, setGroupPopupVisible] = useState("");

  const styleNotification = { marginTop: 85 };
  const showTutorial = !dataTable.length;

  const optionsValidAll = [
    { label: "有效", value: "valid" },
    { label: "全部", value: "all" },
  ];

  const [confirmModal, confirmModalContextHolder] = Modal.useModal();

  const transformDataTable = (d: SetupKey[]): SetupKeyDataTable[] => {
    return d.map(
      (p) =>
      ({
        ...p,
        groupsCount: p.auto_groups ? p.auto_groups.length : 0,
      } as SetupKeyDataTable)
    );
  };

  useEffect(() => {
    dispatch(
      setupKeyActions.getSetupKeys.request({
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
  }, []);

  const fetchData = async () => {
    setIsRefreshButtonDisabled(true);

    dispatch(
      setupKeyActions.getSetupKeys.request({
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

  useEffect(() => {
    setDataTable(transformDataTable(filterDataTable("")));
  }, [textToSearch, optionValidAll]);

  useEffect(() => {
    if (!loading) {
      const quickFilter = getFilterState("setupKeysFilter", "quickFilter");
      if (quickFilter) setOptionValidAll(quickFilter);

      const searchText = getFilterState("setupKeysFilter", "search");
      if (searchText) setTextToSearch(searchText);

      const pageSize = getFilterState("setupKeysFilter", "pageSize");
      if (pageSize) onChangePageSize(pageSize, "setupKeysFilter");

      if (quickFilter || searchText || pageSize) {
        setDataTable(transformDataTable(filterDataTable(searchText)));
      } else {
        setDataTable(transformDataTable(filterDataTable("")));
      }
    }
  }, [loading]);

  const deleteKey = "deleting";
  useEffect(() => {
    if (deletedSetupKey.loading) {
      message.loading({
        content: "删除中...",
        key: deleteKey,
        style: styleNotification,
      });
    } else if (deletedSetupKey.success) {
      message.success({
        content: "成功删除设置密钥。",
        key: deleteKey,
        duration: 2,
        style: styleNotification,
      });
      dispatch(
        setupKeyActions.setDeleteSetupKey({
          ...deletedSetupKey,
          success: false,
        })
      );
      dispatch(setupKeyActions.resetDeletedSetupKey(null));
    } else if (deletedSetupKey.error) {
      message.error({
        content: "删除设置密钥失败。可能权限不足。",
        key: deleteKey,
        duration: 2,
        style: styleNotification,
      });
      dispatch(
        setupKeyActions.setDeleteSetupKey({ ...deletedSetupKey, error: null })
      );
      dispatch(setupKeyActions.resetDeletedSetupKey(null));
    }
  }, [deletedSetupKey]);

  const createKey = "saving";
  useEffect(() => {
    if (savedSetupKey.loading) {
      message.loading({
        content: "保存中...",
        key: createKey,
        duration: 1,
        style: styleNotification,
      });
    } else if (savedSetupKey.success) {
      dispatch(
        setupKeyActions.setSavedSetupKey({ ...savedSetupKey, success: false })
      );
      dispatch(setupKeyActions.resetSavedSetupKey(null));
      dispatch(setupKeyActions.setSetupEditKeyVisible(false));
      setShowGroupModal(false);
    } else if (savedSetupKey.error) {
      message.error({
        content: "更新设置密钥失败。可能权限不足。",
        key: createKey,
        duration: 2,
        style: styleNotification,
      });
      dispatch(
        setupKeyActions.setSavedSetupKey({ ...savedSetupKey, error: null })
      );
      dispatch(setupKeyActions.resetSavedSetupKey(null));
    }
  }, [savedSetupKey]);

  const filterDataTable = (searchText: string): SetupKey[] => {
    const t = searchText
      ? searchText.toLowerCase().trim()
      : textToSearch.toLowerCase().trim();
    let f: SetupKey[] = [...setupKeys];
    if (optionValidAll === "valid") {
      f = filter(setupKeys, (_f: SetupKey) => _f.valid && !_f.revoked);
    }
    f = filter(
      f,
      (_f: SetupKey) =>
        _f.name.toLowerCase().includes(t) ||
        _f.state.includes(t) ||
        _f.type.toLowerCase().includes(t) ||
        _f.key.toLowerCase().includes(t) ||
        t === ""
    ) as SetupKey[];
    return f;
  };

  const onChangeTextToSearch = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setTextToSearch(e.target.value);
    storeFilterState("setupKeysFilter", "search", e.target.value);
  };

  // const searchDataTable = () => {
  //   const data = filterDataTable();
  //   setDataTable(transformDataTable(data));
  // };

  const onChangeValidAll = ({ target: { value } }: RadioChangeEvent) => {
    setOptionValidAll(value);
    storeFilterState("setupKeysFilter", "quickFilter", value);
  };

  const showConfirmRevoke = (setupKeyToAction: SetupKeyDataTable) => {
    let name = setupKeyToAction ? setupKeyToAction.name : "";
    confirmModal.confirm({
      icon: <ExclamationCircleOutlined />,
      title: <span className="font-500">撤销设置密钥 {name}</span>,
      width: 500,
      content: (
        <Space direction="vertical" size="small">
          <Paragraph>确定要撤销密钥吗？</Paragraph>
        </Space>
      ),
      onOk() {
        dispatch(
          setupKeyActions.saveSetupKey.request({
            getAccessTokenSilently: getTokenSilently,
            payload: {
              id: setupKeyToAction ? setupKeyToAction.id : null,
              revoked: true,
              name: setupKeyToAction ? setupKeyToAction.name : null,
              auto_groups:
                setupKeyToAction && setupKeyToAction.auto_groups
                  ? setupKeyToAction.auto_groups
                  : [],
            } as SetupKeyToSave,
          })
        );
      },
    });
  };

  const onClickAddNewSetupKey = () => {
    const autoGroups: string[] = [];
    dispatch(setupKeyActions.setSetupNewKeyVisible(true));
    dispatch(
      setupKeyActions.setSetupKey({
        name: "",
        type: "one-off",
        auto_groups: autoGroups,
        expires_in: 7,
      } as SetupKey)
    );
  };

  const setKeyAndView = (key: SetupKeyDataTable) => {
    dispatch(setupKeyActions.setSetupEditKeyVisible(true));
    dispatch(
      setupKeyActions.setSetupKey({
        id: key?.id || null,
        key: key?.key,
        name: key?.name,
        revoked: key?.revoked,
        expires: key?.expires,
        state: key?.state,
        type: key?.type,
        used_times: key?.used_times,
        valid: key?.valid,
        auto_groups: key?.auto_groups,
        last_used: key?.last_used,
        usage_limit: key?.usage_limit,
        ephemeral: key?.ephemeral,
      } as SetupKey)
    );
  };

  const setKeyAndViewGroups = (key: SetupKeyDataTable) => {
    dispatch(
      setupKeyActions.setSetupKey({
        id: key?.id || null,
        key: key?.key,
        name: key?.name,
        revoked: key?.revoked,
        expires: key?.expires,
        state: key?.state,
        type: key?.type,
        used_times: key?.used_times,
        valid: key?.valid,
        auto_groups: key?.auto_groups,
        last_used: key?.last_used,
        usage_limit: key?.usage_limit,
      } as SetupKey)
    );
    setShowGroupModal(true);
  };

  useEffect(() => {
    if (setupNewKeyVisible) {
      setGroupPopupVisible("");
    }
  }, [setupNewKeyVisible]);

  const onPopoverVisibleChange = (b: boolean, key: string) => {
    if (setupNewKeyVisible) {
      setGroupPopupVisible("");
    } else {
      if (b) {
        setGroupPopupVisible(key);
      } else {
        setGroupPopupVisible("");
      }
    }
  };

  const renderPopoverGroups = (
    label: string,
    rowGroups: string[] | string[] | null,
    setupKeyToAction: SetupKeyDataTable
  ) => {
    let groupsMap = new Map<string, Group>();
    groups.forEach((g) => {
      groupsMap.set(g.id!, g);
    });

    let displayGroups: Group[] = [];
    if (rowGroups) {
      displayGroups = rowGroups
        .filter((g) => groupsMap.get(g))
        .map((g) => groupsMap.get(g)!);
    }

    let btn = (
      <Button
        type="link"
        onClick={() =>
          setKeyAndViewGroups(setupKeyToAction as SetupKeyDataTable)
        }
      >
        {displayGroups.length}
      </Button>
    );
    if (!displayGroups || displayGroups!.length < 1) {
      return btn;
    }

    const content = displayGroups?.map((g, i) => {
      const _g = g as Group;
      const peersCount = ` - 共 ${_g.peers_count || 0} ${!_g.peers_count || parseInt(_g.peers_count) !== 1 ? "个设备" : "个设备"
        } `;
      return (
        <div key={i}>
          <Tag color="blue" style={{ marginRight: 3 }}>
            {_g.name}
          </Tag>
          <span style={{ fontSize: ".85em" }}>{peersCount}</span>
        </div>
      );
    });
    const mainContent = <Space direction="vertical">{content}</Space>;
    let popoverPlacement = "top";
    if (content && content.length > 5) {
      popoverPlacement = "rightTop";
    }

    return (
      <Popover
        placement={popoverPlacement as TooltipPlacement}
        key={setupKeyToAction.key}
        onOpenChange={(b: boolean) =>
          onPopoverVisibleChange(b, setupKeyToAction.key)
        }
        open={groupPopupVisible === setupKeyToAction.key}
        content={mainContent}
        title={null}
      >
        {btn}
      </Popover>
    );
  };

  return (
    <>
      <Container style={{ paddingTop: "40px" }}>
        {!setupEditKeyVisible && (
          <Row>
            <Col span={24}>
              <Title className="page-heading">设置密钥</Title>
              {setupKeys.length ? (
                <Paragraph style={{ marginTop: "5px" }}>
                  设置密钥是预认证密钥，允许在您的网络中注册新设备。
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://docs.netbird.io/how-to/register-machines-using-setup-keys"
                  >
                    {" "}
                    了解更多
                  </a>
                </Paragraph>
              ) : (
                <Paragraph style={{ marginTop: "5px" }} type={"secondary"}>
                  设置密钥是预认证密钥，允许在您的网络中注册新设备。
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://docs.netbird.io/how-to/register-machines-using-setup-keys"
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
                    {/*<Input.Search allowClear value={textToSearch} onPressEnter={searchDataTable} onSearch={searchDataTable} placeholder="Search..." onChange={onChangeTextToSearch} />*/}
                    <Input
                      allowClear
                      value={textToSearch}
                      // onPressEnter={searchDataTable}
                      placeholder="按名称、类型或密钥前缀搜索..."
                      onChange={onChangeTextToSearch}
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
                      <Radio.Group
                        options={optionsValidAll}
                        onChange={onChangeValidAll}
                        value={optionValidAll}
                        optionType="button"
                        buttonStyle="solid"
                        disabled={!dataTable?.length}
                      />
                      <Select
                        style={{ marginRight: "10px" }}
                        disabled={!dataTable?.length}
                        value={pageSize.toString()}
                        options={pageSizeOptions}
                        onChange={(value) => {
                          onChangePageSize(value, "setupKeysFilter");
                        }}
                        className="select-rows-per-page-en"
                      />
                    </Space>

                    <Tooltip
                      title={
                        isRefreshButtonDisabled
                          ? "You can refresh it again in 5 seconds"
                          : "Refresh"
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
                  {dataTable.length ? (
                    <Col xs={24} sm={24} md={5} lg={5} xl={5} xxl={5} span={5}>
                      <Row justify="end">
                        <Col>
                          <Button
                            type="primary"
                            onClick={onClickAddNewSetupKey}
                          >
                            添加密钥
                          </Button>
                        </Col>
                      </Row>
                    </Col>
                  ) : (
                    <></>
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
                {showTutorial && !loading ? (
                  <Card bodyStyle={{ padding: 0 }}>
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
                        创建设置密钥
                      </Title>
                      <Paragraph
                        style={{
                          textAlign: "center",
                          whiteSpace: "pre-line",
                        }}
                      >
                        添加设置密钥以在您的网络中注册新设备。{"\n"}该密钥将在初始设置期间将设备链接到您的帐户。{" "}
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href="https://docs.netbird.io/how-to/register-machines-using-setup-keys"
                        >
                          {" "}
                          了解更多
                        </a>
                      </Paragraph>
                      <Button
                        size={"middle"}
                        type="primary"
                        onClick={() => onClickAddNewSetupKey()}
                      >
                        添加设置密钥
                      </Button>
                    </Space>
                  </Card>
                ) : (
                  <Card bodyStyle={{ padding: 0 }}>
                    <Table
                      pagination={{
                        pageSize,
                        showSizeChanger: false,
                        showTotal: (total, range) =>
                          `显示第 ${range[0]} 到第 ${range[1]} 条，共 ${total} 条设置密钥`,
                      }}
                      className="card-table"
                      showSorterTooltip={false}
                      scroll={{ x: true }}
                      loading={tableSpin(loading)}
                      dataSource={dataTable}
                      style={{ minHeight: "300px" }}
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
                        render={(text, record: any, index) => {
                          return (
                            <Button
                              type="text"
                              onClick={() =>
                                setKeyAndView(record as SetupKeyDataTable)
                              }
                              className="tooltip-label"
                            >
                              <span style={{ textAlign: "left" }}>
                                <Row>
                                  {" "}
                                  <Text className="font-500">
                                    <Badge
                                      size={"small"}
                                      status={
                                        record.state === "valid"
                                          ? "success"
                                          : "error"
                                      }
                                      text={text}
                                    ></Badge>
                                  </Text>
                                </Row>
                              </span>
                            </Button>
                          );
                        }}
                        defaultSortOrder="ascend"
                      />
                      <Column
                        title="类型"
                        dataIndex="type"
                        onFilter={(value: string | number | boolean, record) =>
                          (record as any).type.includes(value)
                        }
                        sorter={(a, b) =>
                          (a as any).type.localeCompare((b as any).type)
                        }
                        render={(text, record, index) => {
                          let sk = record as SetupKeyDataTable;
                          let expiry = sk.ephemeral ? (
                            <Tooltip title="超过10分钟离线的设备将自动移除">
                              <Tag>
                                <Text type="secondary" style={{ fontSize: 10 }}>
                                  临时性
                                </Text>
                              </Tag>
                            </Tooltip>
                          ) : null;
                          return (
                            <>
                              <div className="emp-wrapper">
                                <p>{sk.type}</p>
                                {expiry}
                              </div>
                            </>
                          );
                        }}
                      />
                      <Column
                        title="密钥"
                        dataIndex="key"
                        onFilter={(value: string | number | boolean, record) =>
                          (record as any).key.includes(value)
                        }
                        sorter={(a, b) =>
                          (a as any).key.localeCompare((b as any).key)
                        }
                        render={(text, record, index) => {
                          return (
                            <Text>{text.substring(0, 4).concat("****")}</Text>
                          );
                        }}
                      />

                      <Column
                        title="上次使用"
                        dataIndex="last_used"
                        sorter={(a, b) =>
                          (a as any).last_used.localeCompare(
                            (b as any).last_used
                          )
                        }
                        render={(text, record, index) => {
                          return !(record as SetupKey).used_times
                            ? "从未使用"
                            : timeAgo(text);
                        }}
                      />
                      <Column
                        title="分组"
                        dataIndex="groupsCount"
                        align="center"
                        render={(text, record: SetupKeyDataTable, index) => {
                          return renderPopoverGroups(
                            text,
                            record.auto_groups,
                            record
                          );
                        }}
                      />
                      <Column
                        title="过期时间"
                        dataIndex="expires"
                        render={(text, record, index) => {
                          return formatDate(text);
                        }}
                      />
                      <Column
                        title=""
                        align="center"
                        render={(text, record, index) => {
                          return (
                            <Button
                              style={{
                                color: "rgba(210, 64, 64, 0.85)",
                              }}
                              type="text"
                              onClick={() =>
                                showConfirmRevoke(record as SetupKeyDataTable)
                              }
                            >
                              撤销
                            </Button>
                          );
                        }}
                      />
                    </Table>
                  </Card>
                )}
              </Space>
            </Col>
          </Row>
        )}
        {setupEditKeyVisible && <SetupKeyEdit />}
      </Container>
      {setupNewKeyVisible && <SetupKeyNew />}
      {showGroupModal && (
        <UpdateKeyGroupModal setShowGroupModal={setShowGroupModal} />
      )}
      {confirmModalContextHolder}
    </>
  );
};

export default SetupKeys;
