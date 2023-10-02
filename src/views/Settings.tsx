import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "typesafe-actions";
import {
  Button,
  Card,
  Col,
  Form,
  Switch,
  message,
  Modal,
  Tooltip,
  Row,
  Space,
  Typography,
  Table,
  Select,
  Radio,
  Input,
  RadioChangeEvent,
  Alert,
  Progress,
  Menu,
  MenuProps,
} from "antd";
import { filter } from "lodash";
import { isLocalDev, isNetBirdHosted } from "../utils/common";
import { storeFilterState, getFilterState } from "../utils/filterState";
import { usePageSizeHelpers } from "../utils/pageSize";
import { useGetTokenSilently } from "../utils/token";
import { useGetGroupTagHelpers } from "../utils/groups";
import { Container } from "../components/Container";
import ExpiresInInput, {
  expiresInToSeconds,
  secondsToExpiresIn,
} from "./ExpiresInInput";
import Column from "antd/lib/table/Column";
import TableSpin from "../components/Spin";
import { checkExpiresIn } from "../utils/common";
import { actions as accountActions } from "../store/account";
import { Account, FormAccount } from "../store/account/types";
import {
  ExclamationCircleOutlined,
  QuestionCircleFilled,
  SettingOutlined,
} from "@ant-design/icons";
import { actions as groupActions } from "../store/group";
import { actions as setupKeyActions } from "../store/setup-key";
import { actions as policyActions } from "../store/policy";
import { actions as nsGroupActions } from "../store/nameservers";
import { actions as routeActions } from "../store/route";
import { actions as userActions } from "../store/user";

const { Title, Paragraph, Text } = Typography;

const styleNotification = { marginTop: 85 };

export const Settings = () => {
  const { getTokenSilently } = useGetTokenSilently();
  const dispatch = useDispatch();
  const { pageSize, onChangePageSize, pageSizeOptions } = usePageSizeHelpers(
    getFilterState("groupsManagementPage", "pageSize")
      ? getFilterState("groupsManagementPage", "pageSize")
      : 10
  );
  const [optionOnOff, setOptionOnOff] = useState(
    getFilterState("groupsManagementPage", "usedFilter")
      ? getFilterState("groupsManagementPage", "usedFilter")
      : "used"
  );

  const optionsOnOff = [
    { label: "已使用", value: "used" },
    { label: "未使用", value: "unused" },
  ];

  const [groupsClicked, setGroupsClicked] = useState(false);
  const [billingClicked, setBillingClicked] = useState(false);
  const [authClicked, setAuthClicked] = useState(true);

  const [filterGroup, setFilterGroup] = useState([]);
  const [textToSearch, setTextToSearch] = useState(
    getFilterState("groupsManagementPage", "search")
      ? getFilterState("groupsManagementPage", "search")
      : ""
  );

  const { } = useGetGroupTagHelpers();

  const accounts = useSelector((state: RootState) => state.account.data);
  const failed = useSelector((state: RootState) => state.account.failed);
  const loading = useSelector((state: RootState) => state.account.loading);
  const updatedAccount = useSelector(
    (state: RootState) => state.account.updatedAccount
  );
  const [formAccount, setFormAccount] = useState({} as FormAccount);
  const [accountToAction, setAccountToAction] = useState({} as FormAccount);
  const groups = useSelector((state: RootState) => state.group.data);
  const groupsLoading = useSelector((state: RootState) => state.group.loading);

  const deleteGroup = useSelector(
    (state: RootState) => state.group.deletedGroup
  );

  // ==========
  const setupKeys = useSelector((state: RootState) => state.setupKey.data);
  const setupKeysLoading = useSelector(
    (state: RootState) => state.setupKey.loading
  );
  // ==========
  const policies = useSelector((state: RootState) => state.policy.data);
  const policiesLoading = useSelector(
    (state: RootState) => state.policy.loading
  );
  // ==========
  const routes = useSelector((state: RootState) => state.route.data);
  const routesLoading = useSelector((state: RootState) => state.route.loading);
  // ==========
  const nsGroup = useSelector((state: RootState) => state.nameserverGroup.data);
  const nsGrouploading = useSelector(
    (state: RootState) => state.nameserverGroup.loading
  );
  // ==========

  const users = useSelector((state: RootState) => state.user.data);
  // ==========

  const [formPeerExpirationEnabled, setFormPeerExpirationEnabled] =
    useState(true);
  const [jwtGroupsEnabled, setJwtGroupsEnabled] = useState(true);
  const [groupsPropagationEnabled, setGroupsPropagationEnabled] =
    useState(true);
  const [jwtGroupsClaimName, setJwtGroupsClaimName] = useState("");
  const [confirmModal, confirmModalContextHolder] = Modal.useModal();
  const { confirm } = Modal;

  const [form] = Form.useForm();
  useEffect(() => {
    dispatch(
      accountActions.getAccounts.request({
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

    dispatch(
      setupKeyActions.getSetupKeys.request({
        getAccessTokenSilently: getTokenSilently,
        payload: null,
      })
    );

    dispatch(
      policyActions.getPolicies.request({
        getAccessTokenSilently: getTokenSilently,
        payload: null,
      })
    );

    dispatch(
      nsGroupActions.getNameServerGroups.request({
        getAccessTokenSilently: getTokenSilently,
        payload: null,
      })
    );

    dispatch(
      routeActions.getRoutes.request({
        getAccessTokenSilently: getTokenSilently,
        payload: null,
      })
    );

    dispatch(
      userActions.getRegularUsers.request({
        getAccessTokenSilently: getTokenSilently,
        payload: null,
      })
    );
  }, []);

  const onChangeTextToSearch = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    storeFilterState("groupsManagementPage", "search", e.target.value);
    setTextToSearch(e.target.value);
  };

  const onChangeOnOff = ({ target: { value } }: RadioChangeEvent) => {
    storeFilterState("groupsManagementPage", "usedFilter", value);
    setOptionOnOff(value);
    renderDataTable();
  };

  useEffect(() => {
    if (accounts.length < 1) {
      console.debug(
        "无效的账户数据返回自管理API",
        accounts
      );
      return;
    }
    let account = accounts[0];

    let fAccount = {
      id: account.id,
      settings: account.settings,
      peer_login_expiration_formatted: secondsToExpiresIn(
        account.settings.peer_login_expiration,
        ["小时", "天"]
      ),
      peer_login_expiration_enabled:
        account.settings.peer_login_expiration_enabled,
      jwt_groups_enabled: account.settings.jwt_groups_enabled,
      jwt_groups_claim_name: account.settings.jwt_groups_claim_name,
      groups_propagation_enabled: account.settings.groups_propagation_enabled,
    } as FormAccount;
    setFormAccount(fAccount);
    setFormPeerExpirationEnabled(fAccount.peer_login_expiration_enabled);
    setJwtGroupsEnabled(fAccount.jwt_groups_enabled);
    setGroupsPropagationEnabled(fAccount.groups_propagation_enabled);
    setJwtGroupsClaimName(fAccount.jwt_groups_claim_name);
    form.setFieldsValue(fAccount);
  }, [accounts]);

  useEffect(() => {
    if (groups && setupKeys && nsGroup && routes && users && policies) {
      renderDataTable();
    }
  }, [
    groups,
    setupKeys,
    nsGroup,
    routes,
    users,
    policies,
    optionOnOff,
    textToSearch,
  ]);

  const renderDataTable = () => {
    const mapForSetupKeys: any = [];
    groups.forEach((item: any) => {
      const cSetupKey = item.setupKey ? item.setupKey : [];
      setupKeys.forEach((item2: any) => {
        if (item2.auto_groups.includes(item.id)) {
          if (cSetupKey.indexOf(item2.id) === -1) {
            cSetupKey.push(item2.id);
          }
        }
        item["setupKey"] = cSetupKey;
      });
      mapForSetupKeys.push(item);
    });

    const mapForNameservers: any = [];
    mapForSetupKeys.forEach((item: any) => {
      const cNameservers = item.nameservers ? item.nameservers : [];
      nsGroup.forEach((item2: any) => {
        if (item2.groups.includes(item.id)) {
          if (cNameservers.indexOf(item2.id) === -1) {
            cNameservers.push(item2.id);
          }
        }
        item["nameservers"] = cNameservers;
      });
      mapForNameservers.push(item);
    });

    const mapForRoutes: any = [];
    mapForNameservers.forEach((item: any) => {
      const cRoutes = item.routes ? item.routes : [];
      routes.forEach((item2: any) => {
        if (item2.groups.includes(item.id)) {
          if (cRoutes.indexOf(item2.id) === -1) {
            cRoutes.push(item2.id);
          }
        }
        item["routes"] = cRoutes;
      });
      mapForRoutes.push(item);
    });

    const mapForUser: any = [];
    mapForRoutes.forEach((item: any) => {
      const cUser = item.user ? item.user : [];
      users.forEach((item2: any) => {
        if (item2.auto_groups.includes(item.id)) {
          if (cUser.indexOf(item2.id) === -1) {
            cUser.push(item2.id);
          }
        }
        item["user"] = cUser;
      });
      mapForUser.push(item);
    });

    const createSingleArrayForPolicy: any = [];
    policies.map((aControl: any) => {
      const cSingleAccessArray = aControl.allGroups ? aControl.allGroups : [];
      aControl.rules[0].destinations.forEach((destination: any) => {
        if (cSingleAccessArray.indexOf(destination.id) === -1) {
          cSingleAccessArray.push(destination.id);
        }
      });

      aControl.rules[0].sources.forEach((source: any) => {
        if (cSingleAccessArray.indexOf(source.id) === -1) {
          cSingleAccessArray.push(source.id);
        }
      });

      aControl["cSingleAccessArray"] = cSingleAccessArray;
      createSingleArrayForPolicy.push(aControl);
    });

    const mapForAccesControl: any = [];
    mapForUser.forEach((item: any) => {
      const cAccessControl = item.accessControl ? item.accessControl : [];
      createSingleArrayForPolicy.forEach((item2: any) => {
        if (item2.cSingleAccessArray.includes(item.id)) {
          if (cAccessControl.indexOf(item2.id) === -1) {
            cAccessControl.push(item2.id);
          }
        }
        item["accessControl"] = cAccessControl;
      });
      mapForAccesControl.push(item);
    });

    const searchString = textToSearch.toLowerCase().trim();
    let f: any = filter(mapForAccesControl, (f: any) =>
      f.name.toLowerCase().includes(searchString)
    );

    if (optionOnOff === "used") {
      const filterUnused = f.filter((item: any) => {
        if (isDisabled(item)) {
          return item;
        }
      });
      setFilterGroup(filterUnused);
    } else {
      const filterUnused = f.filter((item: any) => {
        if (!isDisabled(item)) {
          return item;
        }
      });
      setFilterGroup(filterUnused);
    }
  };

  const updatingSettings = "updating_settings";
  useEffect(() => {
    if (updatedAccount.loading) {
      message.loading({
        content: "正在保存...",
        key: updatingSettings,
        duration: 0,
        style: styleNotification,
      });
    } else if (updatedAccount.success) {
      message.success({
        content: "账户设置已成功保存。",
        key: updatingSettings,
        duration: 2,
        style: styleNotification,
      });
      dispatch(
        accountActions.setUpdateAccount({ ...updatedAccount, success: false })
      );
      dispatch(accountActions.resetUpdateAccount(null));
      let fAccount = {
        id: updatedAccount.data.id,
        settings: updatedAccount.data.settings,
        peer_login_expiration_formatted: secondsToExpiresIn(
          updatedAccount.data.settings.peer_login_expiration,
          ["小时", "天"]
        ),
        peer_login_expiration_enabled:
          updatedAccount.data.settings.peer_login_expiration_enabled,
        jwt_groups_enabled: updatedAccount.data.settings.jwt_groups_enabled,
        jwt_groups_claim_name:
          updatedAccount.data.settings.jwt_groups_claim_name,
        groups_propagation_enabled:
          updatedAccount.data.settings.groups_propagation_enabled,
      } as FormAccount;
      setFormAccount(fAccount);
    } else if (updatedAccount.error) {
      let errorMsg = "更新账户设置失败";
      switch (updatedAccount.error.statusCode) {
        case 403:
          errorMsg =
            "更新账户设置失败。您可能没有足够的权限。";
          break;
        default:
          errorMsg = updatedAccount.error.data.message
            ? updatedAccount.error.data.message
            : errorMsg;
          break;
      }
      message.error({
        content: errorMsg,
        key: updatingSettings,
        duration: 5,
        style: styleNotification,
      });
    }
  }, [updatedAccount]);

  const handleFormSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        confirmSave({
          ...values,
          peer_login_expiration_enabled: formPeerExpirationEnabled,
          jwt_groups_enabled: jwtGroupsEnabled,
          jwt_groups_claim_name: jwtGroupsClaimName,
          groups_propagation_enabled: groupsPropagationEnabled,
        });
      })
      .catch((errorInfo) => {
        let msg = "请检查字段并重试";
        if (errorInfo.errorFields) {
          msg = errorInfo.errorFields[0].errors[0];
        }
        message.error({
          content: msg,
          duration: 1,
        });
      });
  };

  const createAccountToSave = (values: FormAccount): Account => {
    return {
      id: formAccount.id,
      settings: {
        peer_login_expiration: expiresInToSeconds(
          values.peer_login_expiration_formatted
        ),
        peer_login_expiration_enabled: values.peer_login_expiration_enabled,
        jwt_groups_enabled: jwtGroupsEnabled,
        jwt_groups_claim_name: jwtGroupsClaimName,
        groups_propagation_enabled: groupsPropagationEnabled,
      },
    } as Account;
  };

  const confirmSave = (newValues: FormAccount) => {
    if (
      newValues.peer_login_expiration_enabled !==
      formAccount.peer_login_expiration_enabled
    ) {
      let content = newValues.peer_login_expiration_enabled
        ? "启用对等登录过期将导致使用SSO登录添加的某些对等方断开连接，并需要重新进行身份验证。您想要启用对等登录过期吗？"
        : "禁用对等登录过期将导致使用SSO登录添加的对等方永不过期。出于安全原因，通常最好定期让对等方过期。您想要禁用对等登录过期吗？";
      confirmModal.confirm({
        icon: <ExclamationCircleOutlined />,
        title: "在更新您的账户设置之前。",
        width: 600,
        okText: newValues.peer_login_expiration_enabled ? "启用" : "禁用",
        content: content,
        onOk() {
          saveAccount(newValues);
        },
        onCancel() { },
      });
    } else {
      saveAccount(newValues);
    }
  };

  const saveAccount = (newValues: FormAccount) => {
    let accountToSave = createAccountToSave(newValues);
    dispatch(
      accountActions.updateAccount.request({
        getAccessTokenSilently: getTokenSilently,
        payload: accountToSave,
      })
    );
  };

  const isDisabled = (group: any) => {
    if (
      (group.accessControl && group.accessControl.length > 0) ||
      (group.nameservers && group.nameservers.length > 0) ||
      (group.peers_count && group.peers_count > 0) ||
      (group.routes && group.routes.length > 0) ||
      (group.setupKey && group.setupKey.length > 0) ||
      (group.user && group.user.length > 0)
    ) {
      return true;
    }
    return false;
  };

  const showConfirmDelete = (record: any) => {
    confirm({
      icon: <ExclamationCircleOutlined />,
      title: <span className="font-500">删除组 {record.name}</span>,
      okText: "删除",
      width: 600,
      content: (
        <Space direction="vertical" size="small">
          <Paragraph>您确定要删除此组吗？</Paragraph>
        </Space>
      ),
      okType: "danger",
      onOk() {
        dispatch(
          groupActions.deleteGroup.request({
            getAccessTokenSilently: getTokenSilently,
            payload: record.id,
          })
        );
      },
      onCancel() { },
    });
  };
  const deleteKey = "deleting";
  useEffect(() => {
    const style = { marginTop: 85 };
    if (deleteGroup.loading) {
      message.loading({ content: "正在删除...", key: deleteKey, style });
    } else if (deleteGroup.success) {
      message.success({
        content: "组已成功删除。",
        key: deleteKey,
        duration: 2,
        style,
      });
      // dispatch(routeActions.resetDeletedRoute(null));
    } else if (deleteGroup.error) {
      message.error({
        content:
          "无法删除组。您可能没有足够的权限。",
        key: deleteKey,
        duration: 2,
        style,
      });
      // dispatch(routeActions.resetDeletedRoute(null));
    }
  }, [deleteGroup]);

  type MenuItem = Required<MenuProps>["items"][number];

  const onClick: MenuProps["onClick"] = (e) => {
    switch (e.key) {
      case "auth":
        setAuthClicked(true);
        setGroupsClicked(false);
        setBillingClicked(false);
        break;
      case "groups":
        setGroupsClicked(true);
        setBillingClicked(false);
        setAuthClicked(false);
        break;
      case "billing":
        setBillingClicked(true);
        setAuthClicked(false);
        setGroupsClicked(false);
        break;
    }
  };

  function getItem(
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
    children?: MenuItem[],
    type?: "group"
  ): MenuItem {
    return {
      key,
      icon,
      children,
      label,
      type,
    } as MenuItem;
  }

  const items: MenuItem[] = [
    getItem(
      "系统设置",
      "sub2",
      <SettingOutlined />,
      [getItem("身份验证", "auth"), getItem("用户组", "groups")],
      "group"
    ),
  ];

  useEffect(() => { }, [groupsClicked, billingClicked, authClicked]);
  const renderSettingForm = () => {
    return (
      <Form
        name="basic"
        autoComplete="off"
        form={form}
        onFinish={handleFormSubmit}
      >
        <Card loading={loading} defaultValue={"Enabled"}>
          <div
            style={{
              color: "rgba(0, 0, 0, 0.88)",
              fontWeight: "500",
              fontSize: "18px",
              marginBottom: "20px",
            }}
          >
            {groupsClicked ? "用户组" : "身份验证"}
          </div>
          <div className={groupsClicked ? "d-none" : ""}>
            <Row>
              <Col span={12}>
                <Form.Item name="peer_login_expiration_enabled" label="">
                  <div
                    style={{
                      display: "flex",
                      gap: "15px",
                    }}
                  >
                    <Switch
                      onChange={(checked) => {
                        setFormPeerExpirationEnabled(checked);
                      }}
                      size="small"
                      checked={formPeerExpirationEnabled}
                    />
                    <div>
                      <label
                        style={{
                          color: "rgba(0, 0, 0, 0.88)",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        对等登录过期{" "}
                        <Tooltip
                          title="对等登录过期允许定期要求使用SSO登录添加的对等方重新进行身份验证。您可以在对等方选项卡中禁用对等方的过期。"
                        >
                          <Text
                            style={{
                              marginLeft: "5px",
                              fontSize: "14px",
                              color: "#bdbdbe",
                            }}
                            type={"secondary"}
                          >
                            <QuestionCircleFilled />
                          </Text>
                        </Tooltip>
                      </label>
                      <Paragraph
                        type={"secondary"}
                        style={{
                          marginTop: "-2",
                          fontWeight: "400",
                          marginBottom: "0",
                        }}
                      >
                        请求定期对使用SSO登录添加的对等方进行重新身份验证
                      </Paragraph>
                    </div>
                  </div>
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={12}>
                <label
                  style={{
                    color: "rgba(0, 0, 0, 0.88)",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  对等登录过期时间
                </label>
                <Paragraph
                  type={"secondary"}
                  style={{
                    marginTop: "-2",
                    fontWeight: "400",
                    marginBottom: "5px",
                  }}
                >
                  每个使用SSO登录添加的对等方需要重新进行身份验证的时间
                </Paragraph>
              </Col>
            </Row>

            <Form.Item
              name="peer_login_expiration_formatted"
              rules={[{ validator: checkExpiresIn }]}
            >
              <ExpiresInInput
                disabled={!formPeerExpirationEnabled}
                options={Array.of(
                  { key: "hour", title: "小时" },
                  {
                    key: "day",
                    title: "天",
                  }
                )}
              />
            </Form.Item>
          </div>
          <div className={!groupsClicked ? "d-none" : ""}>
            <Row>
              <Col span={12}>
                <Form.Item name="groups_propagation_enabled" label="">
                  <div
                    style={{
                      display: "flex",
                      gap: "15px",
                    }}
                  >
                    <Switch
                      onChange={(checked) => {
                        setGroupsPropagationEnabled(checked);
                      }}
                      size="small"
                      checked={groupsPropagationEnabled}
                    />
                    <div>
                      <label
                        style={{
                          color: "rgba(0, 0, 0, 0.88)",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        启用用户组传播
                        <Tooltip title="用户组传播将在下次自动更新用户组时生效。">
                          <Text
                            style={{
                              marginLeft: "5px",
                              fontSize: "14px",
                              color: "#bdbdbe",
                            }}
                            type={"secondary"}
                          >
                            <QuestionCircleFilled />
                          </Text>
                        </Tooltip>
                      </label>
                      <Paragraph
                        type={"secondary"}
                        style={{
                          marginTop: "-2",
                          fontWeight: "400",
                          marginBottom: "0",
                        }}
                      >
                        允许将用户的自动用户组传播给对等方，共享成员信息
                      </Paragraph>
                    </div>
                  </div>
                </Form.Item>
              </Col>
            </Row>
            {(!isNetBirdHosted() || isLocalDev()) && (
              <>
                <Row>
                  <Col span={12}>
                    <Form.Item name="jwt_groups_enabled" label="">
                      <div
                        style={{
                          display: "flex",
                          gap: "15px",
                        }}
                      >
                        <Switch
                          onChange={(checked) => {
                            setJwtGroupsEnabled(checked);
                          }}
                          size="small"
                          checked={jwtGroupsEnabled}
                        />
                        <div>
                          <label
                            style={{
                              color: "rgba(0, 0, 0, 0.88)",
                              fontSize: "14px",
                              fontWeight: "500",
                            }}
                          >
                            启用JWT组同步
                          </label>
                          <Paragraph
                            type={"secondary"}
                            style={{
                              marginTop: "-2",
                              fontWeight: "400",
                              marginBottom: "0",
                            }}
                          >
                            从JWT声明中提取和同步用户的自动用户组，从令牌自动创建用户组。
                          </Paragraph>
                        </div>
                      </div>
                    </Form.Item>
                  </Col>
                </Row>
                <Row>
                  <Col span={12}>
                    <label
                      style={{
                        color: "rgba(0, 0, 0, 0.88)",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      JWT声明
                    </label>
                    <Paragraph
                      type={"secondary"}
                      style={{
                        marginTop: "-2",
                        fontWeight: "400",
                        marginBottom: "5px",
                      }}
                    >
<<<<<<< HEAD
                      指定从中提取组名的JWT声明，例如角色或组，以添加到帐户组
=======
                      Specify the JWT claim for extracting group names, e.g.,
                      roles or groups, to add to account groups (this claim should contain a list of group names).
>>>>>>> 21e69e642a37f0b8285a9f16eacc4491f1677513
                    </Paragraph>
                  </Col>
                </Row>
                <Row>
                  <Col lg={6}>
                    <Form.Item name="jwt_groups_claim_name">
                      <Input
                        value={jwtGroupsClaimName}
                        autoComplete="off"
                        onKeyDown={(event) => {
                          if (event.code === "Space") event.preventDefault();
                        }}
                        onChange={(e) => {
                          let val = e.target.value;
                          var t = val.replace(/ /g, "");
                          setJwtGroupsClaimName(t);
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}
          </div>
          <Col
            span={24}
            style={{ marginTop: "10px", marginBottom: "24px" }}
            className={groupsClicked ? "d-none" : ""}
          >
            <Text type={"secondary"}>
              了解更多关于
              <a
                target="_blank"
                rel="noreferrer"
                href="https://docs.netbird.io/how-to/enforce-periodic-user-authentication"
              >
                登录过期
              </a>
            </Text>
          </Col>
          <Form.Item style={{ marginBottom: "0" }}>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </Form.Item>
        </Card>
      </Form>
    );
  };
  return (
    <>
      <Container style={{ paddingTop: "40px" }}>
        {/*<Title className="page-heading">Settings</Title>
<Paragraph type="secondary">
  Manage the settings of your account
</Paragraph>*/}
        <Row style={{ gap: "10px", flexFlow: "row" }} className="setting-nav">
          <Col span={4}>
            <Menu
              items={items}
              onClick={onClick}
              defaultSelectedKeys={["auth"]}
              style={{ borderInlineEnd: "none" }}
            ></Menu>
          </Col>
          <Col span={20}>
            {authClicked && (
              <Row style={{ marginTop: "0", width: "100%" }}>
                <Col span={24}>{renderSettingForm()}</Col>
              </Row>
            )}
            {groupsClicked && (
              <>
                <Row
                  style={{
                    marginTop: "0",
                    marginBottom: "20px",
                    width: "100%",
                  }}
                >
                  <Col span={24}>{renderSettingForm()}</Col>
                </Row>
                <Row style={{ marginTop: "0", width: "100%" }}>
                  <Col span={24}>
                    <Card
                      bordered={true}
                      loading={loading}
                      style={{ marginBottom: "7px", width: "100%" }}
                    >
                      <div>
                        <Paragraph
                          style={{
                            textAlign: "left",
                            whiteSpace: "pre-line",
                            fontSize: "18px",
                            fontWeight: "500",
                          }}
                        >
                          用户组
                        </Paragraph>
                        <Row
                          gutter={21}
                          style={{ marginTop: "-16px", marginBottom: "10px" }}
                        >
                          <Col
                            xs={24}
                            sm={24}
                            md={20}
                            lg={20}
                            xl={20}
                            xxl={20}
                            span={20}
                          >
                            <Paragraph
                              type={"secondary"}
                              style={{
                                textAlign: "left",
                                whiteSpace: "pre-line",
                              }}
                            >
                              这是您帐户的用户组概述。您可以删除未使用的用户组。
                            </Paragraph>
                          </Col>
                        </Row>

                        <Row gutter={[16, 24]} style={{ marginBottom: "20px" }}>
                          <Col
                            xs={24}
                            sm={24}
                            md={8}
                            lg={8}
                            xl={8}
                            xxl={8}
                            span={8}
                          >
                            <Input
                              allowClear
                              value={textToSearch}
                              // onPressEnter={searchDataTable}
                              placeholder="按组名搜索"
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
                            <Space
                              size="middle"
                              style={{ marginRight: "15px" }}
                            >
                              <Radio.Group
                                options={optionsOnOff}
                                onChange={onChangeOnOff}
                                value={optionOnOff}
                                optionType="button"
                                buttonStyle="solid"
                              />
                              <Select
                                value={pageSize.toString()}
                                options={pageSizeOptions}
                                onChange={(value) => {
                                  onChangePageSize(
                                    value,
                                    "groupsManagementPage"
                                  );
                                }}
                                className="select-rows-per-page-en"
                              />
                            </Space>
                          </Col>
                        </Row>

                        <Table
                          size={"small"}
                          showHeader={false}
                          scroll={{ x: 800 }}
                          pagination={{
                            pageSize,
                            showSizeChanger: false,
                            showTotal: (total, range) =>
                              `显示 ${range[0]} 到 ${range[1]} 共 ${total} 个组`,
                          }}
                          loading={TableSpin(
                            groupsLoading ||
                            setupKeysLoading ||
                            policiesLoading ||
                            routesLoading ||
                            nsGrouploading
                          )}
                          dataSource={filterGroup}
                        >
                          <Column
                            className={"non-highlighted-table-column"}
                            sorter={(a, b) =>
                              (a as any).name.localeCompare((b as any).name)
                            }
                            defaultSortOrder="ascend"
                            render={(text, record, index) => {
                              return (
                                <>
                                  <Row>
                                    <Col>
                                      <Paragraph
                                        style={{
                                          margin: "0px",
                                          padding: "0px",
                                          fontWeight: 500,
                                        }}
                                      >
                                        {(record as any).name}
                                      </Paragraph>
                                    </Col>
                                  </Row>
                                </>
                              );
                            }}
                          />

                          <Column
                            className={"non-highlighted-table-column"}
                            render={(text, record, index) => {
                              return (
                                <>
                                  <Row>
                                    <Col>
                                      <Paragraph
                                        type={"secondary"}
                                        style={{
                                          textAlign: "left",
                                          fontSize: "12px",
                                        }}
                                      >
                                        对等方
                                      </Paragraph>
                                      <Paragraph
                                        type={"secondary"}
                                        style={{
                                          textAlign: "left",
                                          marginTop: "-10px",
                                          marginBottom: "0",
                                          fontSize: "15px",
                                        }}
                                      >
                                        {(record as any).peers_count}
                                      </Paragraph>
                                    </Col>
                                  </Row>
                                </>
                              );
                            }}
                          />

                          <Column
                            className={"non-highlighted-table-column"}
                            render={(text, record: any, index) => {
                              return (
                                <>
                                  <Row>
                                    <Col>
                                      <Paragraph
                                        type={"secondary"}
                                        style={{
                                          textAlign: "left",
                                          fontSize: "12px",
                                        }}
                                      >
                                        访问控制
                                      </Paragraph>
                                      <Paragraph
                                        type={"secondary"}
                                        style={{
                                          textAlign: "left",
                                          marginTop: "-10px",
                                          marginBottom: "0",
                                          fontSize: "15px",
                                        }}
                                      >
                                        {record.accessControl &&
                                          record.accessControl.length}
                                      </Paragraph>
                                    </Col>
                                  </Row>
                                </>
                              );
                            }}
                          />

                          <Column
                            className={"non-highlighted-table-column"}
                            render={(text, record: any, index) => {
                              return (
                                <>
                                  <Row>
                                    <Col>
                                      <Paragraph
                                        type={"secondary"}
                                        style={{
                                          textAlign: "left",
                                          fontSize: "12px",
                                        }}
                                      >
                                        DNS
                                      </Paragraph>
                                      <Paragraph
                                        type={"secondary"}
                                        style={{
                                          textAlign: "left",
                                          marginTop: "-10px",
                                          marginBottom: "0",
                                          fontSize: "15px",
                                        }}
                                      >
                                        {record.nameservers &&
                                          record.nameservers.length}
                                      </Paragraph>
                                    </Col>
                                  </Row>
                                </>
                              );
                            }}
                          />

                          <Column
                            className={"non-highlighted-table-column"}
                            render={(text, record: any, index) => {
                              return (
                                <>
                                  <Row>
                                    <Col>
                                      <Paragraph
                                        type={"secondary"}
                                        style={{
                                          textAlign: "left",
                                          fontSize: "12px",
                                        }}
                                      >
                                        路由
                                      </Paragraph>
                                      <Paragraph
                                        type={"secondary"}
                                        style={{
                                          textAlign: "left",
                                          marginTop: "-10px",
                                          marginBottom: "0",
                                          fontSize: "15px",
                                        }}
                                      >
                                        {record.routes && record.routes.length}
                                      </Paragraph>
                                    </Col>
                                  </Row>
                                </>
                              );
                            }}
                          />

                          <Column
                            className={"non-highlighted-table-column"}
                            render={(text, record: any, index) => {
                              return (
                                <>
                                  <Row>
                                    <Col>
                                      <Paragraph
                                        type={"secondary"}
                                        style={{
                                          textAlign: "left",
                                          fontSize: "12px",
                                        }}
                                      >
                                        设置密钥
                                      </Paragraph>
                                      <Paragraph
                                        type={"secondary"}
                                        style={{
                                          textAlign: "left",
                                          marginTop: "-10px",
                                          marginBottom: "0",
                                          fontSize: "15px",
                                        }}
                                      >
                                        {record.setupKey &&
                                          record.setupKey.length}
                                      </Paragraph>
                                    </Col>
                                  </Row>
                                </>
                              );
                            }}
                          />

                          <Column
                            className={"non-highlighted-table-column"}
                            render={(text, record: any, index) => {
                              return (
                                <>
                                  <Row>
                                    <Col>
                                      <Paragraph
                                        type={"secondary"}
                                        style={{
                                          textAlign: "left",
                                          fontSize: "12px",
                                        }}
                                      >
                                        用户
                                      </Paragraph>
                                      <Paragraph
                                        type={"secondary"}
                                        style={{
                                          textAlign: "left",
                                          marginTop: "-10px",
                                          marginBottom: "0",
                                          fontSize: "15px",
                                        }}
                                      >
                                        {record.user && record.user.length}
                                      </Paragraph>
                                    </Col>
                                  </Row>
                                </>
                              );
                            }}
                          />
                          <Column
                            align="right"
                            render={(text, record, index) => {
                              const isButtonDisabled = isDisabled(record);

                              return (
                                <Tooltip
                                  className="delete-button"
                                  title={
                                    isButtonDisabled
                                      ? "删除依赖于此组的内容后才能删除该组。"
                                      : ""
                                  }
                                >
                                  <Button
                                    danger={true}
                                    type={"text"}
                                    disabled={isButtonDisabled}
                                    onClick={() => {
                                      showConfirmDelete(record);
                                    }}
                                  >
                                    删除
                                  </Button>
                                </Tooltip>
                              );
                            }}
                          />
                        </Table>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </>
            )}
          </Col>
        </Row>
      </Container>
      {confirmModalContextHolder}
    </>
  );
};

export default Settings;
