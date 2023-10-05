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
  message,
  InputNumber,
  Row,
  Select,
  SelectProps,
  Space,
  Switch,
  Modal,
  Typography,
  Tabs,
} from "antd";
import type { TabsProps } from "antd";
import CreatableSelect from "react-select/creatable";
import { Route, RouteToSave } from "../store/route/types";
import { Header } from "antd/es/layout/layout";
import { RuleObject } from "antd/lib/form";
import cidrRegex from "cidr-regex";
import {
  initPeerMaps,
  peerToPeerIP,
  routePeerSeparator,
  transformGroupedDataTable,
} from "../utils/routes";
import { useGetTokenSilently } from "../utils/token";
import { useGetGroupTagHelpers } from "../utils/groups";

const { Paragraph, Text } = Typography;
const { Panel } = Collapse;

interface FormRoute extends Route {}

const RouteAddNew = (selectedPeer: any) => {
  const [activeTab, setActiveTab] = useState<string | null>(null);
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
  const setupNewRouteVisible = useSelector(
    (state: RootState) => state.route.setupNewRouteVisible
  );
  const setupNewRouteHA = useSelector(
    (state: RootState) => state.route.setupNewRouteHA
  );
  const peers = useSelector((state: RootState) => state.peer.data);
  const route = useSelector((state: RootState) => state.route.route);
  const routes = useSelector((state: RootState) => state.route.data);
  const savedRoute = useSelector((state: RootState) => state.route.savedRoute);
  const [previousRouteKey, setPreviousRouteKey] = useState("");
  const [editName, setEditName] = useState(false);
  const [editDescription, setEditDescription] = useState(false);
  const options: SelectProps["options"] = [];
  const testOptions: SelectProps["options"] = [];
  const [formRoute, setFormRoute] = useState({} as FormRoute);
  const [form] = Form.useForm();
  const inputNameRef = useRef<any>(null);
  const inputDescriptionRef = useRef<any>(null);
  const [enableNetwork, setEnableNetwork] = useState(false);
  const [peerNameToIP, peerIPToName, peerIPToID] = initPeerMaps(peers);
  const [newRoute, setNewRoute] = useState(false);

  useEffect(() => {
    if (setupNewRouteVisible) setActiveTab("routingPeer");
  }, [setupNewRouteVisible]);

  useEffect(() => {
    if (editName)
      inputNameRef.current!.focus({
        cursor: "end",
      });
  }, [editName]);

  useEffect(() => {
    if (editDescription)
      inputDescriptionRef.current!.focus({
        cursor: "end",
      });
  }, [editDescription]);

  useEffect(() => {
    if (!route) return;

    if (selectedPeer && selectedPeer.selectedPeer) {
      options?.push({
        label: peerToPeerIP(
          selectedPeer.selectedPeer.name,
          selectedPeer.selectedPeer.ip
        ),
        value: peerToPeerIP(
          selectedPeer.selectedPeer.name,
          selectedPeer.selectedPeer.ip
        ),
        disabled: false,
      });
      const udpateRoute = { ...route, peer: options[0].value } as FormRoute;
      setFormRoute(udpateRoute);
      form.setFieldsValue(udpateRoute);
      setPreviousRouteKey(udpateRoute.network_id + udpateRoute.network);
    } else {
      const fRoute = {
        ...route,
        groups: getGroupNamesFromIDs(route.groups),
      } as FormRoute;
      setFormRoute(fRoute);
      setPreviousRouteKey(fRoute.network_id + fRoute.network);
      form.setFieldsValue(fRoute);
    }

    if (!route.network_id) {
      setNewRoute(true);
    } else {
      setNewRoute(false);
    }
  }, [route]);

  selectedPeer &&
    selectedPeer.notPeerRoutes &&
    selectedPeer.notPeerRoutes.forEach((element: any, index: number) => {
      testOptions?.push({
        label: element.network_id + " - " + element.network,
        value: element.network_id + "+" + index,
        network: element.network,
        disabled: false,
        key: index,
      });
    });
  if (!selectedPeer.selectedPeer) {
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
  }

  const createRouteToSave = (inputRoute: FormRoute): RouteToSave => {
    if (inputRoute.peer_groups) {
      inputRoute = {
        ...inputRoute,
        peer_groups: [inputRoute.peer_groups[inputRoute.peer_groups.length - 1]],
      };
    }
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

    const payload = {
      id: inputRoute.id,
      network: inputRoute.network,
      network_id: inputRoute.network_id,
      description: inputRoute.description,
      enabled: inputRoute.enabled,
      masquerade: inputRoute.masquerade,
      metric: inputRoute.metric,
      groups: existingGroups,
      groupsToCreate: groupsToCreate,
    } as RouteToSave;
 
    if (activeTab === "routingPeer") {
      let pay = { ...payload, peer: peerID };
      return pay;
    }

    if (activeTab === "groupOfPeers") {
      if (inputRoute.peer_groups) {
        let [currentPeersGroup, peerGroupsToCreate] =
          getExistingAndToCreateGroupsLists(inputRoute.peer_groups);

        let pay = {
          ...payload,
          peer_groups: currentPeersGroup,
          peerGroupsToCreate: peerGroupsToCreate,
        };
        return pay;
      }
    }

    return payload;
  };

  const handleFormSubmit = () => {
    form
      .validateFields()
      .then(() => {
        const t = routes.filter((route) => {
          if (
            route.network_id === formRoute.network_id &&
            route.network === formRoute.network
          ) {
            return route;
          }
        });

        if (
          formRoute.peer_groups &&
          formRoute.peer_groups.length > 0 &&
          t &&
          t.length > 0
        ) {
          const style = { marginTop: 85 };
          const duplicateNetworkIdKey = "duplicateKey";
          return message.error({
            content:
              "已存在具有此网络标识符和网络范围的路由。请使用不同的网络标识符或网络范围。",
            key: duplicateNetworkIdKey,
            duration: 5,
            style,
          });
        }

        if (!setupNewRouteHA || formRoute.peer != "") {
          const routeToSave = createRouteToSave(formRoute);
          dispatch(
            routeActions.saveRoute.request({
              getAccessTokenSilently: getTokenSilently,
              payload: routeToSave,
            })
          );
        } else {
          let groupedDataTable = transformGroupedDataTable(routes, peers);
          groupedDataTable.forEach((group) => {
            if (group.key === previousRouteKey) {
              group.groupedRoutes.forEach((route) => {
                let updateRoute: FormRoute = {
                  ...formRoute,
                  id: route.id,
                  peer: route.peer,
                  metric: route.metric,
                  enabled:
                    formRoute.enabled !== group.enabled
                      ? formRoute.enabled
                      : route.enabled,
                };
                const routeToSave = createRouteToSave(updateRoute);
                dispatch(
                  routeActions.saveRoute.request({
                    getAccessTokenSilently: getTokenSilently,
                    payload: routeToSave,
                  })
                );
              });
            }
          });
        }
      })
      .catch((errorInfo) => {
        console.log("errorInfo", errorInfo);
      });
  };

  const setVisibleNewRoute = (status: boolean) => {
    dispatch(routeActions.setSetupNewRouteVisible(status));
  };

  const setSetupNewRouteHA = (status: boolean) => {
    dispatch(routeActions.setSetupNewRouteHA(status));
  };

  const onCancel = () => {
    if (savedRoute.loading) return;
    setActiveTab(null);
    setEditName(false);
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
        peer_groups: [],
      } as Route)
    );
    setVisibleNewRoute(false);
    setSetupNewRouteHA(false);
    setPreviousRouteKey("");
    setNewRoute(false);
  };

  const onChange = (data: any) => {
    setFormRoute({ ...formRoute, ...data });
  };

  const peerDropDownRender = (menu: React.ReactElement) => <>{menu}</>;

  const toggleEditName = (status: boolean) => {
    setEditName(status);
  };

  const toggleEditDescription = (status: boolean) => {
    setEditDescription(status);
  };

  const networkRangeValidator = (_: RuleObject, value: string) => {
    if (!cidrRegex().test(value)) {
      return Promise.reject(
        new Error("请输入有效的CIDR，例如 192.168.1.0/24")
      );
    }

    if (Number(value.split("/")[1]) < 7) {
      return Promise.reject(
        new Error("请输入一个大于/7的网络掩码")
      );
    }

    return Promise.resolve();
  };

  const peerValidator = (_: RuleObject, value: string) => {
    if (value === "" && newRoute) {
      return Promise.reject(new Error("请选择路由设备"));
    }

    return Promise.resolve();
  };

  const peerGroupsValidaton = (_: RuleObject, value: string) => {
     if (value.length < 1) {
      return Promise.reject(new Error("请选择一个设备组"));
    }
    return Promise.resolve();
  };
 
  const selectPreValidator = (obj: RuleObject, value: string[]) => {
    if (setupNewRouteHA && formRoute.peer === "") {
      let [, newGroups] = getExistingAndToCreateGroupsLists(value);
      if (newGroups.length > 0) {
        return Promise.reject(
          new Error(
            "您不能从群组更新视图中添加新的群组，请移除。:\"" +
              newGroups +
              '"'
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

  const onNetworkChange = (selectedOption: any) => {
    if (selectedOption === null) {
      const updateNetwork = {
        ...formRoute,
        network: "",
        network_id: "",
      };
      form.setFieldsValue(updateNetwork);
      setFormRoute(updateNetwork);
      setEnableNetwork(false);
    } else if (!!selectedOption.__isNew__) {
      const updateNetwork = {
        ...formRoute,
        network: "",
        network_id: selectedOption.value.split("+")[0],
      };
      form.setFieldsValue(updateNetwork);
      setFormRoute(updateNetwork);
      setEnableNetwork(false);
    } else {
      const updateNetwork = {
        ...formRoute,
        network: selectedOption.network,
        network_id: selectedOption.value.split("+")[0],
      };
      form.setFieldsValue(updateNetwork);
      setFormRoute(updateNetwork);
      setEnableNetwork(true);
    }
  };

  const onTabChange = (key: string) => {
    setActiveTab(key);
  };

  const handleSingleChangeTags = (values: any) => {
     const lastValue = values[values.length - 1];
     if (values.length > 0) {
      form.setFieldsValue({
        peer_groups: [lastValue],
      });
    }
  };

  const items: TabsProps["items"] = [
    {
      key: "routingPeer",
      label: "路由设备",
      children: (
        <>
          <Paragraph
            type={"secondary"}
            style={{
              marginTop: "-2",
              fontWeight: "400",
              marginBottom: "5px",
            }}
          >
            为网络 CIDR 指定一个对等点作为路由对等点
          </Paragraph>
          {activeTab === "routingPeer" && (
            <Form.Item name="peer" rules={[{ validator: peerValidator }]}>
              <Select
                showSearch
                style={{ width: "100%" }}
                placeholder="Select Peer"
                dropdownRender={peerDropDownRender}
                options={options}
                allowClear={true}
                disabled={!!selectedPeer.selectedPeer}
              />
            </Form.Item>
          )}{" "}
        </>
      ),
    },
    {
      key: "groupOfPeers",
      label: "设备组",
      children: (
        <>
          <Paragraph
            type={"secondary"}
            style={{
              marginTop: "-2",
              fontWeight: "400",
              marginBottom: "5px",
            }}
          >
            为用作路由设备的 Linux 机器指定设备组
          </Paragraph>
          {activeTab === "groupOfPeers" && (
            <Form.Item
              name="peer_groups"
              rules={[{ validator: peerGroupsValidaton }]}
            >
              <Select
                mode="tags"
                style={{ width: "100%" }}
                tagRender={blueTagRender}
                onChange={handleSingleChangeTags}
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
          )}
        </>
      ),
    },
  ];

  return (
    <>
      {route && setupNewRouteVisible && (
        <Modal
          open={setupNewRouteVisible}
          onCancel={onCancel}
          footer={
            <Space style={{ display: "flex", justifyContent: "end" }}>
              <Button onClick={onCancel} disabled={savedRoute.loading}>
                取消
              </Button>
              <Button
                type="primary"
                disabled={savedRoute.loading}
                onClick={handleFormSubmit}
              >
                添加路由
              </Button>
            </Space>
          }
        >
          <Form
            layout="vertical"
            form={form}
            requiredMark={false}
            onValuesChange={onChange}
            className="route-form"
          >
            <Row gutter={16}>
              <Col span={24}>
                <Header
                  style={{
                    border: "none",
                  }}
                >
                  <Paragraph
                    style={{
                      textAlign: "start",
                      whiteSpace: "pre-line",
                      fontSize: "18px",
                      margin: "0px",
                      fontWeight: 500,
                      marginBottom: "25px",
                    }}
                  >
                    添加路由
                  </Paragraph>

                  {!!selectedPeer.selectedPeer && (
                    <div style={{ lineHeight: "20px" }}>
                      <label
                        style={{
                          color: "rgba(0, 0, 0, 0.88)",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        路由设备
                      </label>
                      <Paragraph
                        type={"secondary"}
                        style={{
                          marginTop: "-2",
                          fontWeight: "400",
                          marginBottom: "5px",
                        }}
                      >
                        为网络CIDR分配一个路由设备
                      </Paragraph>
                      <Form.Item
                        name="peer"
                        rules={[{ validator: peerValidator }]}
                      >
                        <Select
                          showSearch
                          style={{ width: "100%" }}
                          placeholder="选择设备"
                          dropdownRender={peerDropDownRender}
                          options={options}
                          allowClear={true}
                          disabled={!!selectedPeer.selectedPeer}
                        />
                      </Form.Item>
                    </div>
                  )}

                  <Row align="top">
                    <Col span={24} style={{ lineHeight: "20px" }}>
                      {!editName && formRoute.id ? (
                        <div
                          className={
                            "access-control input-text ant-drawer-title"
                          }
                          onClick={() => toggleEditName(true)}
                        >
                          {formRoute.id ? formRoute.network_id : "新路由"}
                        </div>
                      ) : (
                        <div style={{ marginBottom: "15px" }}>
                          {!!selectedPeer.selectedPeer && (
                            <>
                              <label
                                style={{
                                  color: "rgba(0, 0, 0, 0.88)",
                                  fontSize: "14px",
                                  fontWeight: "500",
                                }}
                              >
                                网络标识符
                              </label>
                              <Paragraph
                                type={"secondary"}
                                style={{
                                  marginTop: "-2",
                                  fontWeight: "400",
                                  marginBottom: "5px",
                                }}
                              >
                                添加一个唯一的加密密钥，分配给每个设备
                              </Paragraph>
                              <CreatableSelect
                                isClearable
                                className="ant-select-selector-custom"
                                options={testOptions}
                                onChange={onNetworkChange}
                                placeholder="选择一个现有网络或添加一个新的"
                                classNamePrefix="react-select"
                              />
                            </>
                          )}
                          {!!!selectedPeer.selectedPeer && (
                            <>
                              <label
                                style={{
                                  color: "rgba(0, 0, 0, 0.88)",
                                  fontSize: "14px",
                                  fontWeight: "500",
                                }}
                              >
                                网络标识符
                              </label>
                              <Paragraph
                                type={"secondary"}
                                style={{
                                  marginTop: "-2",
                                  fontWeight: "400",
                                  marginBottom: "5px",
                                }}
                              >
                                添加一个唯一的加密密钥，分配给每个设备
                              </Paragraph>
                              <Form.Item
                                name="network_id"
                                label=""
                                style={{ marginBottom: "10px" }}
                                rules={[
                                  {
                                    required: true,
                                    message: "请为此访问路由添加标识符",
                                    whitespace: true,
                                  },
                                ]}
                              >
                                <Input
                                  placeholder="例如“aws-eu-central-1-vpc”"
                                  ref={inputNameRef}
                                  disabled={!setupNewRouteHA && !newRoute}
                                  onPressEnter={() => toggleEditName(false)}
                                  onBlur={() => toggleEditName(false)}
                                  autoComplete="off"
                                  maxLength={40}
                                />
                              </Form.Item>
                            </>
                          )}
                        </div>
                      )}
                      {!editDescription ? (
                        <div
                          onClick={() => toggleEditDescription(true)}
                          style={{
                            margin: "0 0 15px",
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
                            disabled={!setupNewRouteHA && !newRoute}
                            onPressEnter={() => toggleEditDescription(false)}
                            onBlur={() => toggleEditDescription(false)}
                            autoComplete="off"
                            maxLength={200}
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
                <label
                  style={{
                    color: "rgba(0, 0, 0, 0.88)",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  网络范围
                </label>
                <Paragraph
                  type={"secondary"}
                  style={{
                    marginTop: "-2",
                    fontWeight: "400",
                    marginBottom: "5px",
                  }}
                >
                  添加一个私有IP地址范围
                </Paragraph>
                <Form.Item
                  name="network"
                  label=""
                  rules={[{ validator: networkRangeValidator }]}
                >
                  <Input
                    placeholder="例如“172.16.0.0/16”"
                    disabled={(!setupNewRouteHA && !newRoute) || enableNetwork}
                    autoComplete="off"
                    minLength={9}
                    maxLength={43}
                  />
                </Form.Item>
              </Col>

              {!!!selectedPeer.selectedPeer && (
                <Col span={24}>
                  {activeTab ? (
                    <Tabs
                      defaultActiveKey={activeTab}
                      items={items}
                      onChange={onTabChange}
                    />
                  ) : (
                    ""
                  )}
                </Col>
              )}
              <Col span={24}>
                <label
                  style={{
                    color: "rgba(0, 0, 0, 0.88)",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  分配组
                </label>
                <Paragraph
                  type={"secondary"}
                  style={{
                    marginTop: "-2",
                    fontWeight: "400",
                    marginBottom: "5px",
                  }}
                >
                  将此路由广播给属于以下组的设备
                </Paragraph>
                <Form.Item
                  name="groups"
                  label=""
                  rules={[{ validator: selectPreValidator }]}
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
                      <Col span={22}>
                        <Form.Item name="masquerade" label="">
                          <div
                            style={{
                              display: "flex",
                              gap: "15px",
                            }}
                          >
                            <Switch
                              size={"small"}
                              disabled={!setupNewRouteHA && !newRoute}
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
                                允许访问您的私有网络，而无需在本地路由器或其他设备上配置路由。
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
                          度量值
                        </label>
                        <Paragraph
                          type={"secondary"}
                          style={{
                            marginTop: "-2",
                            fontWeight: "400",
                            marginBottom: "5px",
                          }}
                        >
                          较低的度量值表示较高优先级的路由
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
              <Col
                span={24}
                style={{ marginTop: "24px", marginBottom: "12px" }}
              >
                <Text type={"secondary"}>
                  了解更多关于
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://docs.netbird.io/how-to/routing-traffic-to-private-networks"
                  >
                    {" "}
                   网络路由
                  </a>
                </Text>
              </Col>
            </Row>
          </Form>
        </Modal>
      )}
    </>
  );
};

export default RouteAddNew;
