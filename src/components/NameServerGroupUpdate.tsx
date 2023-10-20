import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "typesafe-actions";
import { actions as nsGroupActions } from "../store/nameservers";
import {
  Button,
  Col,
  Switch,
  Form,
  FormListFieldData,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Space,
  Typography,
  Card,
  Breadcrumb,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Header } from "antd/es/layout/layout";
import { RuleObject } from "antd/lib/form";
import cidrRegex from "cidr-regex";
import {
  NameServer,
  NameServerGroup,
  NameServerGroupToSave,
} from "../store/nameservers/types";
import { useGetGroupTagHelpers } from "../utils/groups";
import { useGetTokenSilently } from "../utils/token";
import { Container } from "./Container";
import { domainValidator } from "../utils/common";
const { Paragraph, Text } = Typography;

interface formNSGroup extends NameServerGroup {}

const NameServerGroupUpdate = (props: any) => {
  const { isGroupUpdateView, setShowGroupModal } = props;

  const {
    blueTagRender,
    handleChangeTags,
    dropDownRender,
    optionRender,
    tagGroups,
    getExistingAndToCreateGroupsLists,
    selectValidator,
  } = useGetGroupTagHelpers();
  const dispatch = useDispatch();
  const { getTokenSilently } = useGetTokenSilently();
  const { Option } = Select;
  const nsGroup = useSelector(
    (state: RootState) => state.nameserverGroup.nameserverGroup
  );
  const setupEditNameServerGroupVisible = useSelector(
    (state: RootState) => state.nameserverGroup.setupEditNameServerGroupVisible
  );
  const savedNSGroup = useSelector(
    (state: RootState) => state.nameserverGroup.savedNameServerGroup
  );
  const nsGroupData = useSelector(
    (state: RootState) => state.nameserverGroup.data
  );

  const [formNSGroup, setFormNSGroup] = useState({} as formNSGroup);
  const [form] = Form.useForm();
  const [editName, setEditName] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  const [editDescription, setEditDescription] = useState(false);
  const inputNameRef = useRef<any>(null);
  const inputDescriptionRef = useRef<any>(null);
  const [matchDomains, setMatchDomains] = useState(0);

  useEffect(() => {
    if (editName)
      inputNameRef.current!.focus({
        cursor: "end",
      });
  }, [editName]);

  useEffect(() => {
    //Unmounting component clean
    return () => {
      onCancel();
    };
  }, []);

  useEffect(() => {
    if (editDescription)
      inputDescriptionRef.current!.focus({
        cursor: "end",
      });
  }, [editDescription]);

  useEffect(() => {
    if (!nsGroup) return;

    let newFormGroup = {
      ...nsGroup,
      groups: nsGroup.groups,
    } as formNSGroup;
    setFormNSGroup(newFormGroup);
    form.setFieldsValue(newFormGroup);

    if (nsGroup.primary !== undefined) {
      setIsPrimary(nsGroup.primary);
    }
  }, [nsGroup]);

  const onCancel = () => {
    dispatch(nsGroupActions.setSetupEditNameServerGroupVisible(false));
    dispatch(
      nsGroupActions.setNameServerGroup({
        id: "",
        name: "",
        description: "",
        primary: false,
        domains: [],
        nameservers: [] as NameServer[],
        groups: [],
        enabled: false,
        search_domains_enabled: true,
      } as NameServerGroup)
    );
    setEditName(false);
    setIsPrimary(false);
    if (setShowGroupModal) {
      setShowGroupModal(false);
    }
  };

  const onChange = (changedValues: any) => {
    if (changedValues.primary !== undefined) {
      setIsPrimary(changedValues.primary);
    }
    setFormNSGroup({ ...formNSGroup, ...changedValues });
  };

  const handleFormSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        let nsGroupToSave = createNSGroupToSave(values as NameServerGroup);
        nsGroupToSave = { ...nsGroupToSave, enabled: formNSGroup.enabled };
        dispatch(
          nsGroupActions.saveNameServerGroup.request({
            getAccessTokenSilently: getTokenSilently,
            payload: nsGroupToSave,
          })
        );
      })
      .then(() => onCancel())
      .catch((errorInfo) => {
        let msg = "请检查各项内容并再试一次。";
        if (errorInfo.errorFields) {
          msg = errorInfo.errorFields[0].errors[0];
        }
        message.error({
          content: msg,
          duration: 1,
        });
      });
  };

  const createNSGroupToSave = (
    values: NameServerGroup
  ): NameServerGroupToSave => {
    let [existingGroups, newGroups] = getExistingAndToCreateGroupsLists(
      values.groups
    );
    return {
      id: formNSGroup.id || null,
      name: values.name ? values.name : formNSGroup.name,
      description: values.description
        ? values.description
        : formNSGroup.description,
      primary: values.domains.length ? false : true,
      domains: values.primary ? [] : values.domains,
      nameservers: values.nameservers,
      groups: existingGroups,
      groupsToCreate: newGroups,
      enabled: values.enabled,
      search_domains_enabled:
        matchDomains > 0 ? formNSGroup.search_domains_enabled : false,
    } as NameServerGroupToSave;
  };

  const toggleEditName = (status: boolean) => {
    setEditName(status);
  };

  const toggleEditDescription = (status: boolean) => {
    setEditDescription(status);
  };

  const nameValidator = (_: RuleObject, value: string) => {
    const found = nsGroupData.find(
      (u) => u.name == value && u.id !== formNSGroup.id
    );
    if (found) {
      return Promise.reject(
        new Error(
          "请为您的域名服务器配置输入一个独特的名称"
        )
      );
    }

    return Promise.resolve();
  };

  const ipValidator = (_: RuleObject, value: string) => {
    if (!cidrRegex().test(value + "/32")) {
      return Promise.reject(
        new Error("请输入有效的IP地址，例如192.168.1.1或8.8.8.8")
      );
    }

    return Promise.resolve();
  };

  // @ts-ignore
  const formListValidator = (_: RuleObject, names) => {
    if (names.length >= 3) {
      return Promise.reject(
        new Error("超过了域名服务器的最大数量。（最多为2）")
      );
    }
    if (names.length < 1) {
      return Promise.reject(new Error("你应该至少添加1个域名服务器"));
    }
    return Promise.resolve();
  };

  // @ts-ignore
  const renderNSList = (
    fields: FormListFieldData[],
    { add, remove }: any,
    { errors }: any
  ) => (
    <Row>
      <Col span={24} style={{ marginBottom: "15px" }}>
        <Form.Item name="enabled" label="">
          <div
            style={{
              display: "flex",
              gap: "15px",
            }}
          >
            <Switch
              onChange={handleChangeDisabled}
              defaultChecked={formNSGroup.enabled}
              size="small"
              checked={formNSGroup.enabled}
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
                {formNSGroup.enabled
                  ? "如果您不希望立即应用配置，请禁用此服务器"
                  : " 如果您希望配置立即应用，请启用此服务器"}
              </Paragraph>
            </div>
          </div>
        </Form.Item>
      </Col>
      <Col>
        <div style={{ width: "100%", maxWidth: "360px" }}>
          <label
            style={{
              color: "rgba(0, 0, 0, 0.88)",
              fontSize: "14px",
              fontWeight: "500",
              marginBottom: "10px",
              display: "block",
            }}
          >
            域名服务器
          </label>
          {!!fields.length && (
            <Row align="middle">
              <Col span={4} style={{ textAlign: "left" }}>
                <Text style={{ color: "#818183", paddingLeft: "5px" }}></Text>
              </Col>
              <Col span={10} style={{ textAlign: "left" }}>
                <Text style={{ color: "#818183", paddingLeft: "5px" }}>
                域名服务器 IP
                </Text>
              </Col>
              <Col span={4} style={{ textAlign: "left" }}>
                <Text style={{ color: "#818183", paddingLeft: "5px" }}>
                  端口
                </Text>
              </Col>
              <Col span={4} />
            </Row>
          )}
          {fields.map((field, index) => {
            return (
              <Row key={index}>
                <Col span={4} style={{ textAlign: "left" }}>
                  <Form.Item
                    style={{ margin: "3px" }}
                    name={[field.name, "ns_type"]}
                    rules={[
                      { required: true, message: "Missing first protocol" },
                    ]}
                    initialValue={"udp"}
                  >
                    <Select
                      disabled
                      style={{ width: "100%" }}
                      className="style-like-text"
                    >
                      <Option value="udp">UDP</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={10} style={{ margin: "1px" }}>
                  <Form.Item
                    style={{ margin: "1px" }}
                    name={[field.name, "ip"]}
                    rules={[{ validator: ipValidator }]}
                  >
                    <Input
                      placeholder="e.g. X.X.X.X"
                      style={{ width: "100%" }}
                      autoComplete="off"
                    />
                  </Form.Item>
                </Col>
                <Col span={4} style={{ textAlign: "center" }}>
                  <Form.Item
                    style={{ margin: "1px" }}
                    name={[field.name, "port"]}
                    rules={[{ required: true, message: "Missing port" }]}
                    initialValue={53}
                  >
                    <InputNumber placeholder="Port" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col
                  span={2}
                  style={{
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MinusCircleOutlined onClick={() => remove(field.name)} />
                </Col>
              </Row>
            );
          })}

          <Row>
            <Col span={20}>
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  style={{
                    maxWidth: "270px",
                    marginTop: "5px",
                  }}
                  disabled={fields.length > 1}
                  icon={<PlusOutlined />}
                >
                  添加域名服务器
                </Button>
                <Form.ErrorList errors={errors} />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Col>
    </Row>
  );

  // @ts-ignore
  const renderDomains = (
    fields: FormListFieldData[],
    { add, remove }: any,
    { errors }: any
  ) => {
    setMatchDomains(fields.length);

    return (
      <div style={{ width: "100%", maxWidth: "305px" }}>
        <Row>
          <Space>
            <Col>
              <label
                style={{
                  color: "rgba(0, 0, 0, 0.88)",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                匹配域名
              </label>
              <Paragraph
                type={"secondary"}
                style={{
                  fontWeight: "400",
                  marginBottom: "10px",
                }}
              >
                如果您想拥有一个特定的域名，请添加域名
              </Paragraph>
            </Col>
          </Space>
        </Row>
        {fields.map((field, index) => {
          return (
            <Row key={index} style={{ marginBottom: "5px" }}>
              <Col span={22}>
                <Form.Item
                  style={{ margin: "0" }}
                  // hidden={isPrimary}
                  {...field}
                  rules={[{ validator: domainValidator }]}
                >
                  <Input
                    placeholder="e.g. example.com"
                    style={{ width: "100%" }}
                    autoComplete="off"
                  />
                </Form.Item>
              </Col>
              <Col
                span={2}
                style={{
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MinusCircleOutlined
                  // hidden={isPrimary}
                  className="dynamic-delete-button"
                  onClick={() => remove(field.name)}
                />
              </Col>
            </Row>
          );
        })}

        <Row>
          <Col span={24} style={{ margin: "1px" }}>
            <Form.Item>
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
                style={{ marginTop: "5px", maxWidth: "280px" }}
              >
                添加域名
              </Button>
            </Form.Item>
          </Col>
        </Row>
        <Form.ErrorList errors={errors} />
      </div>
    );
  };

  const handleChangeDisabled = (checked: boolean) => {
    setFormNSGroup({
      ...formNSGroup,
      enabled: checked,
    });
  };

  const onBreadcrumbUsersClick = () => {
    onCancel();
  };

  const handleChangeMarkDomain = (checked: boolean) => {
    setFormNSGroup({
      ...formNSGroup,
      search_domains_enabled: checked,
    });
  };

  return (
    <>
      <Container style={{ paddingTop: `${!isGroupUpdateView ? "40px" : "0"}` }}>
        {!isGroupUpdateView && (
          <Breadcrumb
            style={{ marginBottom: "25px" }}
            items={[
              {
                title: <a onClick={onBreadcrumbUsersClick}>DNS</a>,
              },
              {
                title: formNSGroup.name,
              },
            ]}
          />
        )}
        <Card className={isGroupUpdateView ? "noborderPadding" : ""}>
          <Form
            layout="vertical"
            requiredMark={false}
            form={form}
            onValuesChange={onChange}
          >
            <Row gutter={16}>
              <span className={isGroupUpdateView ? "d-none" : ""}>
                <Col span={24}>
                  <Header
                    style={{
                      border: "none",
                    }}
                  >
                    <Row align="top">
                      <Col flex="auto">
                        {!editName && formNSGroup.id ? (
                          <div
                            className={
                              "access-control input-text ant-drawer-title"
                            }
                            onClick={() => toggleEditName(true)}
                            style={{
                              fontSize: "22px",
                              margin: " 0px 0px 10px",
                              cursor: "pointer",
                              fontWeight: "500",
                              lineHeight: "24px",
                            }}
                          >
                            {formNSGroup.id
                              ? formNSGroup.name
                              : "新DNS服务器组"}
                          </div>
                        ) : (
                          <Row>
                            <Col span={8}>
                              <div style={{ lineHeight: "15px" }}>
                                <label
                                  style={{
                                    color: "rgba(0, 0, 0, 0.88)",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                  }}
                                >
                                  名称
                                </label>
                                <Form.Item
                                  name="name"
                                  rules={[
                                    {
                                      required: true,
                                      message:
                                        "请为该DNS服务器组添加一个标识符",
                                      whitespace: true,
                                    },
                                    {
                                      validator: nameValidator,
                                    },
                                  ]}
                                  style={{
                                    marginBottom: "10px",
                                    marginTop: "10px",
                                  }}
                                >
                                  <Input
                                    placeholder="e.g. Public DNS"
                                    ref={inputNameRef}
                                    onPressEnter={() => toggleEditName(false)}
                                    onBlur={() => toggleEditName(false)}
                                    autoComplete="off"
                                    maxLength={40}
                                  />
                                </Form.Item>
                              </div>
                            </Col>
                          </Row>
                        )}
                        {!editDescription ? (
                          <div
                            className={
                              "access-control input-text ant-drawer-subtitle"
                            }
                            style={{ margin: "0 0 39px 0px" }}
                            onClick={() => toggleEditDescription(true)}
                          >
                            {formNSGroup.description &&
                            formNSGroup.description.trim() !== ""
                              ? formNSGroup.description
                              : "添加描述"}
                          </div>
                        ) : (
                          <Row>
                            <Col span={8} style={{ marginBottom: "15px" }}>
                              <div
                                style={{
                                  lineHeight: "15px",
                                  marginTop: "24px",
                                }}
                              >
                                <label
                                  style={{
                                    color: "rgba(0, 0, 0, 0.88)",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                  }}
                                >
                                  描述
                                </label>
                                <Form.Item
                                  name="description"
                                  style={{ marginTop: "8px" }}
                                >
                                  <Input
                                    placeholder="添加描述..."
                                    ref={inputDescriptionRef}
                                    onPressEnter={() =>
                                      toggleEditDescription(false)
                                    }
                                    onBlur={() => toggleEditDescription(false)}
                                    autoComplete="off"
                                  />
                                </Form.Item>
                              </div>
                            </Col>
                          </Row>
                        )}
                      </Col>
                    </Row>
                  </Header>
                </Col>

                <Col span={24} style={{ marginBottom: "15px" }}>
                  <Form.List
                    name="nameservers"
                    rules={[{ validator: formListValidator }]}
                  >
                    {renderNSList}
                  </Form.List>
                </Col>

                <Col span={24} style={{ marginBottom: "15px" }}>
                  <Form.List name="domains">{renderDomains}</Form.List>
                </Col>

                {matchDomains > 0 && (
                  <Col span={24}>
                    <Form.Item name="search_domains_enabled" label="">
                      <div
                        style={{
                          display: "flex",
                          gap: "15px",
                        }}
                      >
                        <Switch
                          onChange={handleChangeMarkDomain}
                          defaultChecked={formNSGroup.search_domains_enabled}
                          size="small"
                        />
                        <div>
                          <label
                            style={{
                              color: "rgba(0, 0, 0, 0.88)",
                              fontSize: "14px",
                              fontWeight: "500",
                            }}
                          >
                            将匹配域标记为搜索域
                          </label>
                          <Paragraph
                            type={"secondary"}
                            style={{
                              marginTop: "-2",
                              fontWeight: "400",
                              marginBottom: "0",
                            }}
                          >
                            例如，"peer.example.com "可以通过
                            "peer "访问
                          </Paragraph>
                        </div>
                      </div>
                    </Form.Item>
                  </Col>
                )}
              </span>

              <Col span={24} style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    color: "rgba(0, 0, 0, 0.88)",
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "5px",
                    display: "block",
                  }}
                >
                  关联组
                </label>
                <Form.Item
                  name="groups"
                  rules={[{ validator: selectValidator }]}
                  style={{ maxWidth: "380px" }}
                >
                  <Select
                    mode="tags"
                    style={{ width: "100%" }}
                    placeholder="将群组与NS群组关联"
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

              <Col
                style={{
                  width: "100%",
                }}
              >
                <Space
                  style={{
                    display: "flex",
                    justifyContent: `${!isGroupUpdateView ? "start" : "end"}`,
                    width: "100%",
                  }}
                >
                  <Button onClick={onCancel} disabled={savedNSGroup.loading}>
                    取消
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleFormSubmit}
                    disabled={savedNSGroup.loading}
                  >
                    保存
                  </Button>
                </Space>
              </Col>
            </Row>
          </Form>
        </Card>
      </Container>
    </>
  );
};

export default NameServerGroupUpdate;
