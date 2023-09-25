import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "typesafe-actions";
import { actions as routeActions } from "../store/route";
import {
  Button,
  Col,
  Collapse,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  SelectProps,
  Breadcrumb,
  Switch,
  Card,
  Typography,
} from "antd";
import { Route, RouteToSave } from "../store/route/types";
import { Header } from "antd/es/layout/layout";
import { RuleObject } from "antd/lib/form";
import {
  initPeerMaps,
  peerToPeerIP,
  routePeerSeparator,
} from "../utils/routes";
import { useGetTokenSilently } from "../utils/token";
import { useGetGroupTagHelpers } from "../utils/groups";
import { Container } from "./Container";

const { Paragraph, Text } = Typography;
const { Panel } = Collapse;

interface FormRoute extends Route {}

const RoutePeerUpdate = () => {
  const {
    blueTagRender,
    handleChangeTags,
    dropDownRender,
    optionRender,
    tagGroups,
    getExistingAndToCreateGroupsLists,
    getGroupNamesFromIDs,
    selectValidator,
  } = useGetGroupTagHelpers();

  const { Option } = Select;
  const { getTokenSilently } = useGetTokenSilently();
  const dispatch = useDispatch();

  const peers = useSelector((state: RootState) => state.peer.data);
  const route = useSelector((state: RootState) => state.route.route);
  const routes = useSelector((state: RootState) => state.route.data);
  const savedRoute = useSelector((state: RootState) => state.route.savedRoute);
  const [editDescription, setEditDescription] = useState(false);
  const options: SelectProps["options"] = [];
  const [formRoute, setFormRoute] = useState({} as FormRoute);
  const [form] = Form.useForm();
  const inputDescriptionRef = useRef<any>(null);
  const [peerNameToIP, peerIPToName, peerIPToID] = initPeerMaps(peers);

  useEffect(() => {
    if (editDescription)
      inputDescriptionRef.current!.focus({
        cursor: "end",
      });
  }, [editDescription]);

  useEffect(() => {
    if (!route) return;
    const fRoute = {
      ...route,
      groups: route.groups,
    } as FormRoute;
    setFormRoute(fRoute);
    form.setFieldsValue(fRoute);
    // let options = [];
  }, [route]);

  peers.forEach((p) => {
    let os: string;
    os = p.os;
    if (
      !os.toLowerCase().startsWith("darwin") &&
      !os.toLowerCase().startsWith("windows") &&
      !os.toLowerCase().startsWith("android") &&
      route &&
      !routes
        .filter((r) => r.network_id === route.network_id)
        .find((r) => r.peer === p.id)
    ) {
      options?.push({
        label: peerToPeerIP(p.name, p.ip),
        value: peerToPeerIP(p.name, p.ip),
        disabled: false,
      });
    }
  });

  const createRouteToSave = (inputRoute: FormRoute): RouteToSave => {
    let peerIDList = inputRoute.peer.split(routePeerSeparator);
    let peerID: string;
    if (peerIDList.length === 1) {
      peerID = inputRoute.peer;
    } else {
      if (peerIDList[1]) {
        peerID = peerIPToID[peerIDList[1]];
      } else {
        peerID = peerIPToID[peerNameToIP[inputRoute.peer]];
      }
    }
    let [existingGroups, groupsToCreate] = getExistingAndToCreateGroupsLists(
      inputRoute.groups
    );

    return {
      id: inputRoute.id,
      network: inputRoute.network,
      network_id: inputRoute.network_id,
      description: inputRoute.description,
      peer: peerID,
      enabled: inputRoute.enabled,
      masquerade: inputRoute.masquerade,
      metric: inputRoute.metric,
      groups: existingGroups,
      groupsToCreate: groupsToCreate,
    } as RouteToSave;
  };

  const handleFormSubmit = () => {
    form
      .validateFields()
      .then(() => {
        if (formRoute.peer !== "") {
          const routeToSave = createRouteToSave(formRoute);
          dispatch(
            routeActions.saveRoute.request({
              getAccessTokenSilently: getTokenSilently,
              payload: routeToSave,
            })
          );
        }
      })
      .catch((errorInfo) => {
        console.log("errorInfo", errorInfo);
      });
  };

  const setVisibleNewRoute = (status: boolean) => {
    dispatch(routeActions.setSetupEditRoutePeerVisible(status));
  };

  const onCancel = () => {
    if (savedRoute.loading) return;
    dispatch(
      routeActions.setRoute({
        network: "",
        network_id: "",
        description: "",
        peer: "",
        metric: 9999,
        masquerade: false,
        enabled: true,
        groups: [],
      } as Route)
    );
    setVisibleNewRoute(false);
  };

  const onChange = (data: any) => {
    setFormRoute({ ...formRoute, ...data });
  };

  const peerDropDownRender = (menu: React.ReactElement) => <>{menu}</>;

  const toggleEditDescription = (status: boolean) => {
    setEditDescription(status);
  };

  const peerValidator = (_: RuleObject, value: string) => {
    if (value == "") {
      return Promise.reject(new Error("请选择一个路由对等体"));
    }

    return Promise.resolve();
  };

  const selectPreValidator = (obj: RuleObject, value: string[]) => {
    if (formRoute.peer === "") {
      let [, newGroups] = getExistingAndToCreateGroupsLists(value);
      if (newGroups.length > 0) {
        return Promise.reject(
          new Error(
            "您不能从组更新视图中添加新的组，请移除：" + newGroups.join(", ")
          )
        );
      }
    }
    return selectValidator(obj, value);
  };

  const handleMasqueradeChange = (checked: boolean) => {
    setFormRoute({
      ...formRoute,
      masquerade: checked,
    });
  };

  const handleEnableChange = (checked: boolean) => {
    setFormRoute({
      ...formRoute,
      enabled: checked,
    });
  };

  const onBreadcrumbUsersClick = () => {
    onCancel();
  };

  const styleNotification = { marginTop: 85 };

  const saveKey = "saving";
  useEffect(() => {
    if (savedRoute.loading) {
      message.loading({
        content: "保存中...",
        key: saveKey,
        duration: 0,
        style: styleNotification,
      });
    } else if (savedRoute.success) {
      message.success({
        content: "路由已成功更新。",
        key: saveKey,
        duration: 2,
        style: styleNotification,
      });
      dispatch(routeActions.setSetupNewRouteVisible(false));
      dispatch(routeActions.setSetupEditRouteVisible(false));
      dispatch(routeActions.setSetupEditRoutePeerVisible(false));
      dispatch(routeActions.setSavedRoute({ ...savedRoute, success: false }));
      dispatch(routeActions.resetSavedRoute(null));
    } else if (savedRoute.error) {
      let errorMsg = "更新网络路由失败";
      switch (savedRoute.error.statusCode) {
        case 403:
          errorMsg = "更新网络路由失败。您可能没有足够的权限。";
          break;
        default:
          errorMsg = savedRoute.error.data.message
            ? savedRoute.error.data.message
            : errorMsg;
          break;
      }
      message.error({
        content: errorMsg,
        key: saveKey,
        duration: 5,
        style: styleNotification,
      });
      dispatch(routeActions.setSavedRoute({ ...savedRoute, error: null }));
      dispatch(routeActions.resetSavedRoute(null));
    }
  }, [savedRoute]);

  return (
    <>
      <Container style={{ paddingTop: "40px", paddingBottom: "50px" }}>
        <Breadcrumb
          style={{ marginBottom: "25px" }}
          items={[
            {
              title: <a onClick={onBreadcrumbUsersClick}>网络路由</a>,
            },
            {
              title: formRoute.network_id,
            },
          ]}
        />
        {route && (
          <Card>
            <Form
              layout="vertical"
              form={form}
              requiredMark={false}
              onValuesChange={onChange}
              style={{ width: "100%", maxWidth: "600px" }}
              className="route-form  edit-form-wrapper"
            >
              <Row gutter={16}>
                <Col span={24}>
                  <Header
                    style={{
                      border: "none",
                    }}
                  >
                    <Row align="top">
                      <Col span={24} style={{ lineHeight: "20px" }}>
                        <div
                          style={{
                            color: "rgba(0, 0, 0, 0.88)",
                            fontWeight: "500",
                            fontSize: "22px",
                          }}
                        >
                          {formRoute.network_id}

                          <Paragraph
                            type={"secondary"}
                            style={{
                              textAlign: "left",
                              whiteSpace: "pre-line",
                              fontWeight: "400",
                              marginBottom: "0",
                            }}
                          >
                            <div style={{ margin: "5px 0" }}>
                              {" "}
                              {formRoute.network}
                            </div>
                            <div></div>
                          </Paragraph>
                        </div>

                        {!editDescription ? (
                          <div
                            onClick={() => toggleEditDescription(true)}
                            style={{
                              margin: "0 0 30px",
                              lineHeight: "22px",
                              cursor: "pointer",
                            }}
                          >
                            {formRoute.description &&
                            formRoute.description.trim() !== "" ? (
                              formRoute.description
                            ) : (
                              <span style={{ textDecoration: "underline" }}>
                                添加描述
                              </span>
                            )}
                          </div>
                        ) : (
                          <Form.Item
                            name="description"
                            label="描述"
                            style={{ marginTop: 24, fontWeight: 500 }}
                          >
                            <Input
                              placeholder="添加描述..."
                              ref={inputDescriptionRef}
                              onPressEnter={() => toggleEditDescription(false)}
                              onBlur={() => toggleEditDescription(false)}
                              autoComplete="off"
                              style={{ maxWidth: "400px" }}
                            />
                          </Form.Item>
                        )}
                      </Col>
                    </Row>
                    <Row align="top">
                      <Col flex="auto"></Col>
                    </Row>
                  </Header>
                </Col>

                <Col span={24}>
                  <Form.Item name="enabled" label="">
                    <div
                      style={{
                        display: "flex",
                        gap: "15px",
                      }}
                    >
                      <Switch
                        size={"small"}
                        checked={formRoute.enabled}
                        onChange={handleEnableChange}
                      />
                      <div>
                        <label
                          style={{
                            color: "rgba(0, 0, 0, 0.88)",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}
                        >
                          启用
                        </label>
                        <Paragraph
                          type={"secondary"}
                          style={{
                            marginTop: "-2",
                            fontWeight: "400",
                            marginBottom: "0",
                          }}
                        >
                          您可以启用或禁用路由
                        </Paragraph>
                      </div>
                    </div>
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <label
                    style={{
                      color: "rgba(0, 0, 0, 0.88)",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    路由对等体
                  </label>
                  <Paragraph
                    type={"secondary"}
                    style={{
                      marginTop: "-2",
                      fontWeight: "400",
                      marginBottom: "5px",
                    }}
                  >
                    为网络CIDR分配一个路由对等体
                  </Paragraph>
                  <Form.Item
                    name="peer"
                    rules={[{ validator: peerValidator }]}
                    style={{ maxWidth: "400px" }}
                  >
                    <Select
                      showSearch
                      style={{ width: "100%" }}
                      placeholder="选择对等体"
                      dropdownRender={peerDropDownRender}
                      options={options}
                      allowClear={true}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <label
                    style={{
                      color: "rgba(0, 0, 0, 0.88)",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    分发组
                  </label>
                  <Paragraph
                    type={"secondary"}
                    style={{
                      marginTop: "-2",
                      fontWeight: "400",
                      marginBottom: "5px",
                    }}
                  >
                    将此路由广播到属于以下组的对等体
                  </Paragraph>
                  <Form.Item
                    name="groups"
                    label=""
                    rules={[{ validator: selectPreValidator }]}
                    style={{ maxWidth: "400px" }}
                  >
                    <Select
                      mode="tags"
                      style={{ width: "100%" }}
                      placeholder="将组与网络路由关联"
                      tagRender={blueTagRender}
                      onChange={handleChangeTags}
                      dropdownRender={dropDownRender}
                      optionFilterProp="serchValue"
                    >
                      {tagGroups.map((m, index) => (
                        <Option key={index} value={m.id} serchValue={m.name}>
                          {optionRender(m.name, m.id)}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Collapse
                    onChange={onChange}
                    bordered={false}
                    ghost={true}
                    style={{ padding: "0" }}
                    className="remove-bg"
                  >
                    <Panel
                      key="0"
                      header={
                        <Paragraph
                          style={{
                            textAlign: "left",
                            whiteSpace: "pre-line",
                            fontSize: "14px",
                            fontWeight: "400",
                            margin: "0",
                            textDecoration: "underline",
                          }}
                        >
                          更多设置
                        </Paragraph>
                      }
                      className="system-info-panel"
                    >
                      <Row gutter={16} style={{ padding: "15px 0 0" }}>
                        <Col span={12}>
                          <Form.Item name="masquerade" label="">
                            <div
                              style={{
                                display: "flex",
                                gap: "15px",
                              }}
                            >
                              <Switch
                                size={"small"}
                                checked={formRoute.masquerade}
                                onChange={handleMasqueradeChange}
                              />
                              <div>
                                <label
                                  style={{
                                    color: "rgba(0, 0, 0, 0.88)",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                  }}
                                >
                                  伪装
                                </label>
                                <Paragraph
                                  type={"secondary"}
                                  style={{
                                    marginTop: "-2",
                                    fontWeight: "400",
                                    marginBottom: "0",
                                  }}
                                >
                                  允许访问您的私有网络，无需在本地路由器或其他设备上配置路由。
                                </Paragraph>
                              </div>
                            </div>
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <label
                            style={{
                              color: "rgba(0, 0, 0, 0.88)",
                              fontSize: "14px",
                              fontWeight: "500",
                            }}
                          >
                            路由度量
                          </label>
                          <Paragraph
                            type={"secondary"}
                            style={{
                              marginTop: "-2",
                              fontWeight: "400",
                              marginBottom: "5px",
                            }}
                          >
                            较低的度量表示较高优先级的路由
                          </Paragraph>
                          <Row>
                            <Col span={12}>
                              <Form.Item name="metric" label="">
                                <InputNumber
                                  min={1}
                                  max={9999}
                                  autoComplete="off"
                                  className="w-100"
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                    </Panel>
                  </Collapse>
                </Col>
              </Row>
              <Col
                span={24}
                style={{
                  display: "flex",
                  justifyContent: "start",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <Button onClick={onCancel} disabled={savedRoute.loading}>
                  取消
                </Button>
                <Button
                  type="primary"
                  disabled={savedRoute.loading}
                  onClick={handleFormSubmit}
                >
                  保存
                </Button>
              </Col>
            </Form>
          </Card>
        )}
      </Container>
    </>
  );
};

export default RoutePeerUpdate;
