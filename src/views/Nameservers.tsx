import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "typesafe-actions";
import { actions as nsGroupActions } from "../store/nameservers";
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Switch,
  message,
  Modal,
  Popover,
  Radio,
  RadioChangeEvent,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Tooltip,
} from "antd";
import { filter } from "lodash";
import { ReloadOutlined } from "@ant-design/icons";
import tableSpin from "../components/Spin";
import { storeFilterState, getFilterState } from "../utils/filterState";
import { useGetTokenSilently } from "../utils/token";
import { actions as groupActions } from "../store/group";
import { Group } from "../store/group/types";
import { TooltipPlacement } from "antd/es/tooltip";
import { NameServer, NameServerGroup } from "../store/nameservers/types";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { useGetGroupTagHelpers } from "../utils/groups";
import { usePageSizeHelpers } from "../utils/pageSize";
import { UpdateNameServerGroupModal } from "../components/UpdateNameServerGroupModal";

const { Title, Paragraph } = Typography;
const { Column } = Table;
const { confirm } = Modal;

interface NameserverGroupDataTable extends NameServerGroup {
  key: string;
}

const styleNotification = { marginTop: 85 };

export const Nameservers = () => {
  const { onChangePageSize, pageSizeOptions, pageSize } = usePageSizeHelpers();
  const { getTokenSilently } = useGetTokenSilently();
  const dispatch = useDispatch();
  const [showGroupModal, setShowGroupModal] = useState(false);
  const { getGroupNamesFromIDs } = useGetGroupTagHelpers();

  const groups = useSelector((state: RootState) => state.group.data);
  const nsGroup = useSelector((state: RootState) => state.nameserverGroup.data);
  const failed = useSelector(
    (state: RootState) => state.nameserverGroup.failed
  );
  const loading = useSelector(
    (state: RootState) => state.nameserverGroup.loading
  );
  const addNewNameServerGroupVisible = useSelector(
    (state: RootState) => state.nameserverGroup.setupNewNameServerGroupVisible
  );
  const savedNSGroup = useSelector(
    (state: RootState) => state.nameserverGroup.savedNameServerGroup
  );

  const deleteNSGroup = useSelector(
    (state: RootState) => state.nameserverGroup.deletedNameServerGroup
  );

  const [groupPopupVisible, setGroupPopupVisible] = useState("");
  const [nsGroupToAction, setNsGroupToAction] = useState(
    null as NameserverGroupDataTable | null
  );

  const [textToSearch, setTextToSearch] = useState("");
  const [isRefreshButtonDisabled, setIsRefreshButtonDisabled] = useState(false);
  const [optionAllEnable, setOptionAllEnable] = useState("all");
  const [dataTable, setDataTable] = useState([] as NameserverGroupDataTable[]);
  const [showTutorial, setShowTutorial] = useState(false);

  const optionsAllEnabled = [
    { label: "全部", value: "all" },
    { label: "已启用", value: "enabled" },
  ];

  useEffect(() => {
    if (nsGroup.length > 0) {
      setShowTutorial(false);
    } else {
      setShowTutorial(true);
    }
  }, [nsGroup]);

  useEffect(() => {
    if (!loading && nsGroup) {
      const quickFilter = getFilterState("nameServerFilter", "quickFilter");
      if (quickFilter) setOptionAllEnable(quickFilter);

      const searchText = getFilterState("nameServerFilter", "search");
      if (searchText) setTextToSearch(searchText);

      const pageSize = getFilterState("nameServerFilter", "pageSize");
      if (pageSize) onChangePageSize(pageSize, "nameServerFilter");
      if (quickFilter || searchText) {
        setDataTable(transformDataTable(filterDataTable(searchText)));
      } else {
        setDataTable(transformDataTable(nsGroup));
      }
    }
  }, [loading, nsGroup]);

  useEffect(() => {
    setDataTable(transformDataTable(filterDataTable("")));
  }, [textToSearch, optionAllEnable]);

  const filterDataTable = (searchText: string): NameServerGroup[] => {
    const t = searchText
      ? searchText.toLowerCase().trim()
      : textToSearch.toLowerCase().trim();
    let f = filter(
      nsGroup,
      (f: NameServerGroup) =>
        f.name.toLowerCase().includes(t) ||
        f.name.includes(t) ||
        t === "" ||
        getGroupNamesFromIDs(f.groups).find((u) =>
          u.toLowerCase().trim().includes(t)
        ) ||
        f.domains.find((d) => d.toLowerCase().trim().includes(t)) ||
        f.nameservers.find((n) => n.ip.includes(t))
    ) as NameServerGroup[];
    if (optionAllEnable !== "all") {
      f = filter(f, (f) => f.enabled);
    }
    return f;
  };

  // setUserAndView makes the UserUpdate drawer visible (right side) and sets the user object
  const setUserAndView = (nsGroup: NameServerGroup) => {
    dispatch(nsGroupActions.setSetupEditNameServerGroupVisible(true));
    dispatch(
      nsGroupActions.setNameServerGroup({
        id: nsGroup.id,
        name: nsGroup.name,
        primary: nsGroup.primary,
        domains: nsGroup.domains,
        description: nsGroup.description,
        nameservers: nsGroup.nameservers,
        groups: nsGroup.groups,
        enabled: nsGroup.enabled,
        search_domains_enabled: nsGroup.search_domains_enabled,
      } as NameServerGroup)
    );
  };

  const setUserAndViewGroups = (nsGroup: NameServerGroup) => {
    dispatch(
      nsGroupActions.setNameServerGroup({
        id: nsGroup.id,
        name: nsGroup.name,
        primary: nsGroup.primary,
        domains: nsGroup.domains,
        description: nsGroup.description,
        nameservers: nsGroup.nameservers,
        groups: nsGroup.groups,
        enabled: nsGroup.enabled,
        search_domains_enabled: nsGroup.search_domains_enabled,
      } as NameServerGroup)
    );
    setShowGroupModal(true);
  };

  const transformDataTable = (
    d: NameServerGroup[]
  ): NameserverGroupDataTable[] => {
    return d.map((p) => ({ key: p.id, ...p } as NameserverGroupDataTable));
  };

  useEffect(() => {
    dispatch(
      nsGroupActions.getNameServerGroups.request({
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
      nsGroupActions.getNameServerGroups.request({
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

  const onChangeAllEnabled = ({ target: { value } }: RadioChangeEvent) => {
    setOptionAllEnable(value);
    storeFilterState("nameServerFilter", "quickFilter", value);
  };

  const onChangeTextToSearch = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setTextToSearch(e.target.value);
    storeFilterState("nameServerFilter", "search", e.target.value);
  };

  // const searchDataTable = () => {
  //   setDataTable(transformDataTable(filterDataTable()));
  // };

  const showConfirmDelete = (record: NameserverGroupDataTable) => {
    setNsGroupToAction(record as NameserverGroupDataTable);
    let name = record ? record.name : "";
    confirm({
      icon: <ExclamationCircleOutlined />,
      title: '删除DNS服务器组 "' + name + '"',
      width: 600,
      content: (
        <Space direction="vertical" size="small">
          <Paragraph>
            确定要从您的帐户中删除此DNS服务器组吗？
          </Paragraph>
        </Space>
      ),
      okType: "danger",
      onOk() {
        dispatch(
          nsGroupActions.deleteNameServerGroup.request({
            getAccessTokenSilently: getTokenSilently,
            payload: record?.id || "",
          })
        );
      },
      onCancel() {
        setNsGroupToAction(null);
      },
    });
  };

  const renderPopoverGroups = (
    label: string,
    rowGroups: string[] | null,
    userToAction: NameserverGroupDataTable
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
        onClick={() => setUserAndViewGroups(userToAction)}
        style={{ padding: "0" }}
      >
        +{displayGroups && displayGroups.length - 1}
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
    const updateContent =
      displayGroups && displayGroups.length > 1
        ? content && content?.slice(1)
        : content;
    const mainContent = <Space direction="vertical">{updateContent}</Space>;
    let popoverPlacement = "top";
    if (content && content.length > 5) {
      popoverPlacement = "rightTop";
    }
    return displayGroups && displayGroups.length === 1 ? (
      <> {displayGroups && displayGroups.length && displayGroups[0].name}</>
    ) : (
      <Popover
        placement={popoverPlacement as TooltipPlacement}
        key={userToAction.id}
        onOpenChange={(b: boolean) =>
          onPopoverVisibleChange(b, userToAction.key + "group")
        }
        open={groupPopupVisible === userToAction.key + "group"}
        content={mainContent}
        title={null}
      >
        <span className="d-flex">
          {displayGroups && displayGroups.length && displayGroups[0].name} {btn}
        </span>
      </Popover>
    );
  };

  const renderPopoverDomains = (
    _: string,
    inputDomains: string[] | null,
    userToAction: NameserverGroupDataTable
  ) => {
    var domains = [] as string[];
    if (inputDomains?.length) {
      domains = inputDomains;
    }

    let btn = domains.length ? (
      <Button type="link" onClick={() => setUserAndView(userToAction)}>
        {domains.length}
      </Button>
    ) : (
      <Tag>全部</Tag>
    );
    if (!domains || domains!.length < 1) {
      return btn;
    }

    const content = domains?.map((d, i) => {
      return (
        <div key={i}>
          <Tag color="blue" style={{ marginRight: 3 }}>
            {d}
          </Tag>
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
        key={userToAction.id}
        onOpenChange={(b: boolean) =>
          onPopoverVisibleChange(b, userToAction.key + "domain")
        }
        open={groupPopupVisible === userToAction.key + "domain"}
        content={mainContent}
        title={null}
      >
        {btn}
      </Popover>
    );
  };

  useEffect(() => {
    if (addNewNameServerGroupVisible) {
      setGroupPopupVisible("");
    }
  }, [addNewNameServerGroupVisible]);

  const createKey = "saving";
  useEffect(() => {
    if (savedNSGroup.loading) {
      message.loading({
        content: "保存中...",
        key: createKey,
        duration: 0,
        style: styleNotification,
      });
    } else if (savedNSGroup.success) {
      message.success({
        content: "DNS服务器已成功保存。",
        key: createKey,
        duration: 2,
        style: styleNotification,
      });
      dispatch(nsGroupActions.setSetupNewNameServerGroupVisible(false));
      dispatch(
        nsGroupActions.setSavedNameServerGroup({
          ...savedNSGroup,
          success: false,
        })
      );
      dispatch(nsGroupActions.resetSavedNameServerGroup(null));
    } else if (savedNSGroup.error) {
      let errorMsg = "更新DNS服务器组失败";
      switch (savedNSGroup.error.statusCode) {
        case 403:
          errorMsg = "更新DNS服务器组失败。您可能没有足够的权限。";
          break;
        default:
          errorMsg = savedNSGroup.error.data.message
            ? savedNSGroup.error.data.message
            : errorMsg;
          break;
      }
      message.error({
        content: errorMsg,
        key: createKey,
        duration: 5,
        style: styleNotification,
      });
      dispatch(
        nsGroupActions.setSavedNameServerGroup({ ...savedNSGroup, error: null })
      );
      dispatch(nsGroupActions.resetSavedNameServerGroup(null));
    }
  }, [savedNSGroup]);

  const createDeleteKey = "Delete";
  useEffect(() => {
    if (deleteNSGroup.loading) {
      message.loading({
        content: "删除中...",
        key: createDeleteKey,
        duration: 0,
        style: styleNotification,
      });
    } else if (deleteNSGroup.success) {
      message.success({
        content: "DNS服务器已成功删除。",
        key: createDeleteKey,
        duration: 2,
        style: styleNotification,
      });
      dispatch(nsGroupActions.resetDeletedNameServerGroup(null));
    } else if (deleteNSGroup.error) {
      let errorMsg = "删除DNS服务器组失败";
      switch (deleteNSGroup.error.statusCode) {
        case 403:
          errorMsg = "删除DNS服务器组失败。您可能没有足够的权限。";
          break;
        default:
          errorMsg = deleteNSGroup.error.data.message
            ? deleteNSGroup.error.data.message
            : errorMsg;
          break;
      }
      message.error({
        content: errorMsg,
        key: createDeleteKey,
        duration: 5,
        style: styleNotification,
      });
      dispatch(
        nsGroupActions.setSavedNameServerGroup({
          ...deleteNSGroup,
          error: null,
        })
      );
      dispatch(nsGroupActions.resetDeletedNameServerGroup(null));
    }
  }, [deleteNSGroup]);

  const onPopoverVisibleChange = (b: boolean, key: string) => {
    if (addNewNameServerGroupVisible) {
      setGroupPopupVisible("");
    } else {
      if (b) {
        setGroupPopupVisible(key);
      } else {
        setGroupPopupVisible("");
      }
    }
  };

  const onClickAddNewNSGroup = () => {
    dispatch(nsGroupActions.setSetupNewNameServerGroupVisible(true));
    dispatch(
      nsGroupActions.setNameServerGroup({
        enabled: true,
        primary: true,
      } as NameServerGroup)
    );
  };

  const handleChangeDisabled = (checked: boolean, record: any) => {
    dispatch(
      nsGroupActions.saveNameServerGroup.request({
        getAccessTokenSilently: getTokenSilently,
        payload: { ...record, enabled: checked },
      })
    );
  };

  return (
    <>
      <>
        {nsGroup.length ? (
          <Paragraph style={{ marginTop: "5px" }}>
            在您的 NetBird 网络中添加用于域名解析的DNS服务器。
            <a
              target="_blank"
              rel="noreferrer"
              href="https://docs.netbird.io/how-to/manage-dns-in-your-network"
            >
              {" "}
              了解更多
            </a>
          </Paragraph>
        ) : (
          <Paragraph style={{ marginTop: "5px" }} type={"secondary"}>
            在您的 NetBird 网络中添加用于域名解析的DNS服务器。
            <a
              target="_blank"
              rel="noreferrer"
              href="https://docs.netbird.io/how-to/manage-dns-in-your-network"
            >
              {" "}
              了解更多
            </a>
          </Paragraph>
        )}
        <Space direction="vertical" size="large" style={{ display: "flex" }}>
          <Row gutter={[16, 24]}>
            <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={8} span={8}>
              <Input
                allowClear
                value={textToSearch}
                // onPressEnter={searchDataTable}
                placeholder="按名称、域名或DNS服务器搜索..."
                onChange={onChangeTextToSearch}
              />
            </Col>
            <Col xs={24} sm={24} md={11} lg={11} xl={11} xxl={11} span={11}>
              <Space size="middle">
                <Radio.Group
                  options={optionsAllEnabled}
                  onChange={onChangeAllEnabled}
                  value={optionAllEnable}
                  optionType="button"
                  buttonStyle="solid"
                  disabled={showTutorial}
                />
                <Select
                  value={pageSize.toString()}
                  options={pageSizeOptions}
                  onChange={(value) => {
                    onChangePageSize(value, "nameServerFilter");
                  }}
                  className="select-rows-per-page-en"
                  disabled={showTutorial}
                />

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
                    style={{ color: "#1890ff" }}
                  >
                    <ReloadOutlined />
                  </Button>
                </Tooltip>
              </Space>
            </Col>
            <Col xs={24} sm={24} md={5} lg={5} xl={5} xxl={5} span={5}>
              <Row justify="end">
                <Col>
                  {!showTutorial && (
                    <Button
                      type="primary"
                      onClick={onClickAddNewNSGroup}
                      disabled={savedNSGroup.loading}
                    >
                      添加DNS服务器
                    </Button>
                  )}
                </Col>
              </Row>
            </Col>
          </Row>
          {failed && (
            <Alert
              message={failed.code}
              description={failed.message}
              type="error"
              showIcon
              closable
            />
          )}
          <Card bodyStyle={{ padding: 0 }}>
            {showTutorial && !loading ? (
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
                  创建DNS服务器
                </Title>
                <Paragraph
                  style={{
                    textAlign: "center",
                    whiteSpace: "pre-line",
                  }}
                >
                  您似乎没有任何DNS服务器。{"\n"}
                  通过向您的网络添加一个来开始。
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://docs.netbird.io/how-to/manage-dns-in-your-network"
                  >
                    {" "}
                    了解更多
                  </a>
                </Paragraph>
                <Button
                  size={"middle"}
                  type="primary"
                  onClick={() => onClickAddNewNSGroup()}
                >
                  添加DNS服务器
                </Button>
              </Space>
            ) : (
              <Table
                pagination={{
                  pageSize,
                  showSizeChanger: false,
                  showTotal: (total, range) =>
                    `显示 ${range[0]} 到 ${range[1]} 共 ${total} 个DNS服务器`,
                }}
                className={`access-control-table ${showTutorial
                    ? "card-table card-table-no-placeholder"
                    : "card-table"
                  }`}
                showSorterTooltip={false}
                scroll={{ x: true }}
                style={{ minHeight: "300px" }}
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
                  render={(text, record) => {
                    return (
                      <Button
                        type="text"
                        onClick={() =>
                          setUserAndView(record as NameserverGroupDataTable)
                        }
                        className="tooltip-label"
                      >
                        {text && text.trim() !== ""
                          ? text
                          : (record as NameServerGroup).id}
                      </Button>
                    );
                  }}
                />
                <Column
                  title="已启用"
                  dataIndex="enabled"
                  align="center"
                  render={(text: Boolean, record) => {
                    return (
                      <Switch
                        onChange={(isChecked) =>
                          handleChangeDisabled(isChecked, record)
                        }
                        disabled={savedNSGroup.loading}
                        defaultChecked={!!text}
                        size="small"
                      />
                    );
                  }}
                />
                <Column
                  title="匹配域名"
                  dataIndex="domains"
                  align="center"
                  render={(text, record: NameserverGroupDataTable) => {
                    return renderPopoverDomains(text, record.domains, record);
                  }}
                />
                <Column
                  title="DNS服务器"
                  dataIndex="nameservers"
                  render={(nameservers: NameServer[]) => (
                    <>
                      {nameservers.map((nameserver) => (
                        <Tag key={nameserver.ip}>{nameserver.ip}</Tag>
                      ))}
                    </>
                  )}
                />
                <Column
                  title="分组"
                  dataIndex="groupsCount"
                  render={(text, record: NameserverGroupDataTable) => {
                    return renderPopoverGroups(text, record.groups, record);
                  }}
                />
                <Column
                  title=""
                  align="center"
                  width="30px"
                  render={(text, record) => {
                    return (
                      <Button
                        type="text"
                        disabled={savedNSGroup.loading}
                        onClick={() =>
                          showConfirmDelete(record as NameserverGroupDataTable)
                        }
                        danger={true}
                      >
                        删除
                      </Button>
                    );
                  }}
                />
              </Table>
            )}
          </Card>
        </Space>
      </>
      {showGroupModal && (
        <UpdateNameServerGroupModal setShowGroupModal={setShowGroupModal} />
      )}
    </>
  );
};

export default Nameservers;
