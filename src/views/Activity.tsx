import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "typesafe-actions";
import { actions as eventActions } from "../store/event";
import { Container } from "../components/Container";
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
  Table,
  Typography,
  Tooltip,
} from "antd";
import { Event } from "../store/event/types";
import { filter } from "lodash";
import tableSpin from "../components/Spin";
import { useGetTokenSilently } from "../utils/token";
import { useOidcUser } from "@axa-fr/react-oidc";
import { capitalize, formatDateTime } from "../utils/common";
import { User } from "../store/user/types";
import { usePageSizeHelpers } from "../utils/pageSize";
import { ReloadOutlined } from "@ant-design/icons";
import { storeFilterState, getFilterState } from "../utils/filterState";

const { Title, Paragraph, Text } = Typography;
const { Column } = Table;

interface EventDataTable extends Event {}

export const Activity = () => {
  const { onChangePageSize, pageSizeOptions, pageSize } = usePageSizeHelpers();
  const { getTokenSilently } = useGetTokenSilently();
  const { oidcUser } = useOidcUser();
  const dispatch = useDispatch();

  const events = useSelector((state: RootState) => state.event.data);
  const failed = useSelector((state: RootState) => state.event.failed);
  const loading = useSelector((state: RootState) => state.event.loading);
  const users = useSelector((state: RootState) => state.user.data);
  const setupKeys = useSelector((state: RootState) => state.setupKey.data);

  const [textToSearch, setTextToSearch] = useState("");
  const [isRefreshButtonDisabled, setIsRefreshButtonDisabled] = useState(false);
  const [dataTable, setDataTable] = useState([] as EventDataTable[]);

  const transformDataTable = (d: Event[]): EventDataTable[] => {
    return d.map((p) => ({ key: p.id, ...p } as EventDataTable));
  };

  useEffect(() => {
    dispatch(
      eventActions.getEvents.request({
        getAccessTokenSilently: getTokenSilently,
        payload: null,
      })
    );
  }, []);

  const fetchData = async() => {
    setIsRefreshButtonDisabled(true);

    dispatch(
      eventActions.getEvents.request({
        getAccessTokenSilently: getTokenSilently,
        payload: null,
      })
    );

    await new Promise((resolve) => setTimeout(resolve, 5000)).then(() =>
      setIsRefreshButtonDisabled(false)
    );
  };
  // useEffect(() => {
  //   setDataTable(transformDataTable(events));
  // }, [events]);

  useEffect(() => {
    setDataTable(transformDataTable(filterDataTable("")));
  }, [textToSearch]);

  const filterDataTable = (searchText: string): Event[] => {
    const t = searchText
      ? searchText.toLowerCase().trim()
      : textToSearch.toLowerCase().trim();
    let usrsMatch: User[] = filter(
      users,
      (u: User) =>
        u.name?.toLowerCase().includes(t) || u.email?.toLowerCase().includes(t)
    ) as User[];
    let f: Event[] = filter(
      events,
      (f: Event) =>
        (f.activity || f.id).toLowerCase().includes(t) ||
        t === "" ||
        usrsMatch.find((u) => u.id === f.initiator_id)
    ) as Event[];
    return f;
  };

  useEffect(() => {
    if (!loading && events) {
      const searchText = getFilterState("activityFilter", "search");
      if (searchText) setTextToSearch(searchText);

      const pageSize = getFilterState("activityFilter", "pageSize");
      if (pageSize) onChangePageSize(pageSize, "activityFilter");

      if (searchText || pageSize) {
        setDataTable(transformDataTable(filterDataTable(searchText)));
      } else {
        setDataTable(transformDataTable(events));
      }
    }
  }, [loading, events]);

  const onChangeTextToSearch = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setTextToSearch(e.target.value);
    storeFilterState("activityFilter", "search", e.target.value);
  };

  const getActivityRow = (objectType: string, name: string, text: string) => {
    return (
      <Row>
        {" "}
        <Text>
          {objectType} <Text type="secondary">{name}</Text> {text}
        </Text>{" "}
      </Row>
    );
  };

  const renderActivity = (event: EventDataTable) => {
    let body = <Text>{event.activity}</Text>;
    switch (event.activity_code) {
      case "peer.group.add":
        return getActivityRow("群组", event.meta.group, "加入到对等群组中");
      case "peer.group.delete":
        return getActivityRow("群组", event.meta.group, "从对等群组中移除");
      case "user.group.add":
        return getActivityRow("群组", event.meta.group, "加入到用户群组中");
      case "user.group.delete":
        return getActivityRow("群组", event.meta.group, "从用户群组中移除");
      case "setupkey.group.add":
        return getActivityRow("群组", event.meta.group, "加入到设置密钥中");
      case "setupkey.group.delete":
        return getActivityRow("群组", event.meta.group, "从设置密钥中移除");
      case "dns.setting.disabled.management.group.add":
        return getActivityRow(
          "群组",
          event.meta.group,
          "加入到禁用管理DNS设置中"
        );
      case "dns.setting.disabled.management.group.delete":
        return getActivityRow(
          "群组",
          event.meta.group,
          "从禁用管理DNS设置中移除"
        );
      case "personal.access.token.create":
        return getActivityRow(
          "个人访问令牌",
          event.meta.name,
          "添加到用户中"
        );
      case "personal.access.token.delete":
        return getActivityRow(
          "个人访问令牌",
          event.meta.name,
          "从用户中移除"
        );
    }
    return body;
  };
  const renderInitiator = (event: EventDataTable) => {
    let body = <></>;
    if (event.initiator_id == "sys") {
      body = (
        <span
          style={{
            height: "auto",
            whiteSpace: "normal",
            textAlign: "left",
          }}
        >
          <Row>
            <Text type="secondary">系统</Text>
          </Row>
        </span>
      );
    }
    switch (event.activity_code) {
      case "peer.login.expire":
        body = (
          <span
            style={{
              height: "auto",
              whiteSpace: "normal",
              textAlign: "left",
            }}
          >
            <Row>
              <Text type="secondary">系统</Text>
            </Row>
          </span>
        );
        break;
      case "setupkey.peer.add":
        const key = setupKeys?.find((k) => k.id === event.initiator_id);
        if (key) {
          body = (
            <span
              style={{
                height: "auto",
                whiteSpace: "normal",
                textAlign: "left",
              }}
            >
              <Row>
                {" "}
                <Text>{key.name}</Text>{" "}
              </Row>
              <Row>
                {" "}
                <Text type="secondary">设置密钥</Text>{" "}
              </Row>
            </span>
          );
        }
        break;
      default:
        if (event.initiator_name || event.initiator_email) {
          body = (
            <span
              style={{
                height: "auto",
                whiteSpace: "normal",
                textAlign: "left",
              }}
            >
              <Row>
                {" "}
                <Text>
                  {event.initiator_name
                    ? event.initiator_name
                    : event.initiator_id}
                </Text>{" "}
              </Row>
              <Row>
                {" "}
                <Text type="secondary">
                  {event.initiator_email ? event.initiator_email : "用户"}
                </Text>{" "}
              </Row>
            </span>
          );
          return body;
        }
    }

    return body;
  };

  const renderMultiRowSpan = (
    primaryRowText: string,
    secondaryRowText: string
  ) => {
    return (
      <span style={{ height: "auto", whiteSpace: "normal", textAlign: "left" }}>
        <Row>
          {" "}
          <Text>{primaryRowText}</Text>{" "}
        </Row>
        <Row>
          {" "}
          <Text type="secondary">{secondaryRowText}</Text>{" "}
        </Row>
      </span>
    );
  };

  const renderTarget = (event: EventDataTable) => {
    if (
      event.activity_code === "account.create" ||
      event.activity_code === "user.join"
    ) {
      return "-";
    }
    switch (event.activity_code) {
      case "account.create":
      case "user.join":
      case "dashboard.login":
        return "-";
      case "rule.add":
      case "rule.delete":
      case "rule.update":
        return renderMultiRowSpan(event.meta.name, "规则");
      case "policy.add":
      case "policy.delete":
      case "policy.update":
        return renderMultiRowSpan(event.meta.name, "策略");
      case "setupkey.add":
      case "setupkey.revoke":
      case "setupkey.update":
      case "setupkey.overuse":
        let cType: string;
        cType = capitalize(event.meta.type);
        return renderMultiRowSpan(
          event.meta.name,
          cType + "设置密钥 " + event.meta.key
        );
      case "group.add":
      case "group.update":
      case "group.delete":
        return renderMultiRowSpan(event.meta.name, "群组");
      case "nameserver.group.add":
      case "nameserver.group.update":
      case "nameserver.group.delete":
        return renderMultiRowSpan(event.meta.name, "DNS服务器群组");
      case "setupkey.peer.add":
      case "user.peer.add":
      case "user.peer.delete":
      case "peer.ssh.enable":
      case "peer.ssh.disable":
      case "peer.rename":
      case "peer.login.expiration.disable":
      case "peer.login.expiration.enable":
      case "user.peer.login":
      case "peer.login.expire":
        return renderMultiRowSpan(event.meta.fqdn, event.meta.ip);
      case "route.add":
      case "route.delete":
      case "route.update":
        return renderMultiRowSpan(
          event.meta.name,
          "范围为 " + event.meta.network_range + " 的路由"
        );
      case "user.group.add":
      case "user.group.delete":
      case "user.role.update":
        if (event.meta.email || event.meta.username || event.target_id) {
          return renderMultiRowSpan(
            event.meta.username ? event.meta.username : event.target_id,
            event.meta.email ? event.meta.email : "用户"
          );
        }
        if (event.meta.user_name) {
          return renderMultiRowSpan(
            event.meta.user_name,
            event.meta.is_service_user ? "服务用户" : "用户"
          );
        }
        return "-";
      case "setupkey.group.add":
      case "setupkey.group.delete":
        return renderMultiRowSpan(event.meta.setupkey, "设置密钥");
      case "peer.group.add":
      case "peer.group.delete":
        return renderMultiRowSpan(event.meta.peer_fqdn, event.meta.peer_ip);
      case "dns.setting.disabled.management.group.add":
      case "dns.setting.disabled.management.group.delete":
      case "account.setting.peer.login.expiration.enable":
      case "account.setting.peer.login.expiration.disable":
      case "account.setting.peer.login.expiration.update":
        return renderMultiRowSpan("", "系统设置");
      case "personal.access.token.create":
      case "personal.access.token.delete":
        if (event.meta.email || event.meta.username || event.target_id) {
          return renderMultiRowSpan(
            event.meta.username ? event.meta.username : event.target_id,
            event.meta.email ? event.meta.email : "用户"
          );
        }
        if (event.meta.user_name) {
          return renderMultiRowSpan(
            event.meta.user_name,
            event.meta.is_service_user ? "服务用户" : "用户"
          );
        }
        return "-";
      case "service.user.create":
      case "service.user.delete":
        return renderMultiRowSpan(event.meta.username, "服务用户");
      case "user.invite":
      case "user.block":
      case "user.delete":
      case "user.unblock":
        if (event.meta.email || event.meta.username || event.target_id) {
          return renderMultiRowSpan(
            event.meta.username ? event.meta.username : event.target_id,
            event.meta.email ? event.meta.email : "用户"
          );
        }
        break;
      default:
        console.error("未知事件 - 缺少处理", event.activity_code);
    }

    return event.target_id;
  };

  return (
    <>
      <Container style={{ paddingTop: "40px" }}>
        <Row>
          <Col span={24}>
            <Title className="page-heading">活动记录</Title>
            <Paragraph type="secondary">
              在这里您可以查看所有账户和网络活动事件。{" "}
              <a
                rel="noreferrer"
                target="_blank"
                href="https://docs.netbird.io/how-to/monitor-system-and-network-activity"
              >
                了解更多
              </a>
            </Paragraph>
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
                    placeholder="搜索..."
                    onChange={onChangeTextToSearch}
                  />
                </Col>
                <Col xs={24} sm={24} md={11} lg={11} xl={11} xxl={11} span={11}>
                  <Space size="middle">
                    <Select
                      style={{ marginRight: "10px" }}
                      value={pageSize.toString()}
                      options={pageSizeOptions}
                      onChange={(value) => {
                        onChangePageSize(value, "activityFilter");
                      }}
                      className="select-rows-per-page-en"
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
                <Table
                  pagination={{
                    pageSize,
                    showSizeChanger: false,
                    showTotal: (total, range) =>
                      `显示 ${range[0]} 到 ${range[1]} 共 ${total} 条活动记录`,
                  }}
                  className="card-table"
                  showSorterTooltip={false}
                  scroll={{ x: true }}
                  loading={tableSpin(loading)}
                  dataSource={dataTable}
                >
                  <Column
                    title="时间戳"
                    dataIndex="timestamp"
                    render={(text, record, index) => {
                      return formatDateTime(text);
                    }}
                  />
                  <Column
                    title="活动"
                    dataIndex="activity"
                    render={(text, record, index) => {
                      return renderActivity(record as EventDataTable);
                    }}
                  />
                  <Column
                    title="发起人"
                    dataIndex="initiator_id"
                    render={(text, record, index) => {
                      return renderInitiator(record as EventDataTable);
                    }}
                  />
                  <Column
                    title="目标"
                    dataIndex="target_id"
                    render={(text, record, index) => {
                      return renderTarget(record as EventDataTable);
                    }}
                  />
                </Table>
              </Card>
            </Space>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Activity;
