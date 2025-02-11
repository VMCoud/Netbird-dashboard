import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { actions as setupKeyActions } from "../store/setup-key";
import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Switch,
  Typography,
} from "antd";
import { RootState } from "typesafe-actions";
import {
  FormSetupKey,
  SetupKey,
  SetupKeyToSave,
} from "../store/setup-key/types";
import { RuleObject } from "antd/lib/form";
import { useGetTokenSilently } from "../utils/token";
import { Container } from "./Container";
import Paragraph from "antd/es/typography/Paragraph";
import { CheckOutlined, CopyOutlined } from "@ant-design/icons";
import { copyToClipboard } from "../utils/common";
import { useGetGroupTagHelpers } from "../utils/groups";

const { Option } = Select;
const { Text } = Typography;

const SetupKeyNew = () => {
  const {
    optionRender,
    blueTagRender,
    tagGroups,
    getExistingAndToCreateGroupsLists,
    setGroupTagFilterAll,
  } = useGetGroupTagHelpers();
  const { getTokenSilently } = useGetTokenSilently();
  const dispatch = useDispatch();
  const setupNewKeyVisible = useSelector(
    (state: RootState) => state.setupKey.setupNewKeyVisible
  );
  const setupKey = useSelector((state: RootState) => state.setupKey.setupKey);
  const savedSetupKey = useSelector(
    (state: RootState) => state.setupKey.savedSetupKey
  );
  const groups = useSelector((state: RootState) => state.group.data);

  const [form] = Form.useForm();
  const [editName] = useState(false);
  const [showPlainToken, setShowPlainToken] = useState(false);
  const [plainToken, setPlainToken] = useState("");
  const [tokenCopied, setTokenCopied] = useState(false);
  const [formSetupKey, setFormSetupKey] = useState({} as FormSetupKey);
  const inputNameRef = useRef<any>(null);

  useEffect(() => {
    if (!editName) return;

    inputNameRef.current!.focus({ cursor: "end" });
  }, [editName]);

  useEffect(() => {
    setGroupTagFilterAll(true);
  }, []);

  const createSetupKeyToSave = (): SetupKeyToSave => {
    let [existingGroups, groupsToCreate] = getExistingAndToCreateGroupsLists(
      formSetupKey.autoGroupNames || []
    );
    const expiresIn = formSetupKey.expires_in
      ? formSetupKey.expires_in * 24 * 3600
      : 7 * 24 * 3600; // the api expects seconds we have days

    return {
      id: formSetupKey.id,
      name: formSetupKey.name,
      type: formSetupKey.type ? formSetupKey.type : "one-off",
      auto_groups: existingGroups,
      revoked: formSetupKey.revoked,
      groupsToCreate: groupsToCreate,
      expires_in: expiresIn,
      usage_limit: formSetupKey.usage_limit,
      ephemeral: formSetupKey.ephemeral,
    } as SetupKeyToSave;
  };

  const handleFormSubmit = async () => {
    try {
      await form.validateFields();
    } catch (e) {
      const errorFields = (e as any).errorFields;
      return console.log("errorInfo", errorFields);
    }

    let setupKeyToSave = createSetupKeyToSave();
    if (setupKeyToSave.type === "reusable") {
      const updateUsageLimit =
        setupKeyToSave.usage_limit === "unlimited" ||
        setupKeyToSave.usage_limit === undefined ||
        setupKeyToSave.usage_limit === " "
          ? 0
          : Number(setupKeyToSave.usage_limit);

      setupKeyToSave = {
        ...setupKeyToSave,
        usage_limit: updateUsageLimit,
      };
    } else {
      setupKeyToSave = {
        ...setupKeyToSave,
        usage_limit: 1,
      };
    }

    dispatch(
      setupKeyActions.saveSetupKey.request({
        getAccessTokenSilently: getTokenSilently,
        payload: setupKeyToSave,
      })
    );
  };

  const setVisibleNewSetupKey = (status: boolean) => {
    form.resetFields();
    setPlainToken("");
    setShowPlainToken(false);
    dispatch(setupKeyActions.setSetupNewKeyVisible(status));
  };

  useEffect(() => {
    if (savedSetupKey.success) {
      setPlainToken(savedSetupKey.data.key);
      setShowPlainToken(true);
    } else if (savedSetupKey.error) {
      setPlainToken("");
      setShowPlainToken(false);
    }
  }, [savedSetupKey]);

  const onCancel = () => {
    if (savedSetupKey.loading) return;

    dispatch(
      setupKeyActions.setSetupKey({
        name: "",
        type: "one-off",
        key: "",
        last_used: "",
        expires: "7",
        state: "valid",
        auto_groups: [] as string[],
        usage_limit: 0,
        used_times: 0,
        expires_in: 7,
        ephemeral: false,
      } as SetupKey)
    );
    setFormSetupKey({} as FormSetupKey);
    setVisibleNewSetupKey(false);
  };

  const onChange = (data: any) => {
    let ifReusableEdit = Object.keys(data).includes("reusable");

    if (ifReusableEdit && data.reusable) {
      form.setFieldValue("usage_limit", "unlimited");
    }
    if (ifReusableEdit && !data.reusable) {
      form.setFieldValue("usage_limit", "1");
    }
    setFormSetupKey({ ...formSetupKey, ...data });
  };

  const selectValidator = (_: RuleObject, value: string[]) => {
    let hasSpaceNamed = [];

    value.forEach(function (v: string) {
      if (!v.trim().length) {
        hasSpaceNamed.push(v);
      }
    });

    if (hasSpaceNamed.length) {
      return Promise.reject(
        new Error("仅含空格的群组名称是不被允许的")
      );
    }

    return Promise.resolve();
  };

  const dropDownRender = (menu: React.ReactElement) => (
    <>
      {menu}
      <Divider style={{ margin: "8px 0" }} />
      <Row style={{ padding: "0 8px 4px" }}>
        <Col flex="auto">
          <span style={{ color: "#9CA3AF" }}>
            通过按"Enter"键添加新的组。
          </span>
        </Col>
        <Col flex="none">
          <svg
            width="14"
            height="12"
            viewBox="0 0 14 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1.70455 7.19176V5.89915H10.3949C10.7727 5.89915 11.1174 5.80634 11.429 5.62074C11.7405 5.43513 11.9875 5.18655 12.1697 4.875C12.3554 4.56345 12.4482 4.21875 12.4482 3.84091C12.4482 3.46307 12.3554 3.12003 12.1697 2.81179C11.9841 2.50024 11.7356 2.25166 11.424 2.06605C11.1158 1.88044 10.7727 1.78764 10.3949 1.78764H9.83807V0.5H10.3949C11.0114 0.5 11.5715 0.650805 12.0753 0.952414C12.5791 1.25402 12.9818 1.65672 13.2834 2.16051C13.585 2.6643 13.7358 3.22443 13.7358 3.84091C13.7358 4.30161 13.648 4.73414 13.4723 5.13849C13.3 5.54285 13.0613 5.89915 12.7564 6.20739C12.4515 6.51562 12.0968 6.75758 11.6925 6.93324C11.2881 7.10559 10.8556 7.19176 10.3949 7.19176H1.70455ZM4.90128 11.0646L0.382102 6.54545L4.90128 2.02628L5.79119 2.91619L2.15696 6.54545L5.79119 10.1747L4.90128 11.0646Z"
              fill="#9CA3AF"
            />
          </svg>
        </Col>
      </Row>
    </>
  );

  const changesDetected = (): boolean => {
    return (
      formSetupKey.name == null ||
      formSetupKey.name !== setupKey.name ||
      formSetupKey?.usage_limit !== setupKey.usage_limit
    );
  };

  const groupsChanged = (): boolean => {
    if (
      setupKey &&
      setupKey?.auto_groups &&
      formSetupKey?.autoGroupNames &&
      formSetupKey?.autoGroupNames.length !== setupKey?.auto_groups.length
    ) {
      return true;
    }
    const formGroupIds =
      groups
        ?.filter((g) => formSetupKey?.autoGroupNames.includes(g.name))
        .map((g) => g.id || "") || [];

    return (
      setupKey.auto_groups?.filter((g) => !formGroupIds.includes(g)).length > 0
    );
  };

  const onCopyClick = (text: string, copied: boolean) => {
    copyToClipboard(text);
    setTokenCopied(true);
    if (copied) {
      setTimeout(() => {
        onCopyClick(text, false);
      }, 2000);
    }
  };

  return (
    <Modal
      style={{
        ...{ maxWidth: window.screen.availWidth <= 425 ? "90%" : "414px" },
      }}
      open={setupNewKeyVisible}
      onCancel={onCancel}
      footer={[
        <Container
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "end",
            padding: 0,
          }}
          key={0}
        >
          {!showPlainToken && (
            <>
              <Button onClick={onCancel}>取消</Button>
              <Button
                type="primary"
                style={{
                  height: "100%",
                  fontSize: "14px",
                  borderRadius: "2px",
                }}
                disabled={savedSetupKey.loading || !!!formSetupKey.name}
                onClick={handleFormSubmit}
              >
                创建密钥
              </Button>
            </>
          )}
          {showPlainToken && (
            <Button
              type="primary"
              disabled={!showPlainToken}
              onClick={onCancel}
            >
              完成
            </Button>
          )}
        </Container>,
      ]}
    >
      <Container
        style={{
          textAlign: "start",
          marginLeft: "-15px",
          marginRight: "-15px",
        }}
      >
        <Paragraph
          style={{
            textAlign: "start",
            whiteSpace: "pre-line",
            fontSize: "18px",
            fontWeight: "500",
          }}
        >
          {showPlainToken
            ? "密钥创建成功！"
            : "创建设置密钥"}
        </Paragraph>
        <Paragraph
          type={"secondary"}
          style={{
            textAlign: "start",
            whiteSpace: "pre-line",
            marginTop: "-20px",
            fontSize: "14px",
            paddingBottom: "25px",
            marginBottom: "4px",
          }}
        >
          {showPlainToken
            ? "此密钥将不再显示，请确保复制并妥善存放"
            : "使用此密钥注册新的设备到您的网络"}
        </Paragraph>
        {!showPlainToken && (
          <Form
            layout="vertical"
            requiredMark={false}
            form={form}
            onValuesChange={onChange}
            initialValues={{
              usage_limit: 1,
              expires_in: 7,
            }}
          >
            <Row>
              <Col span={24}>
                <Paragraph style={{ fontWeight: "500" }}>名称</Paragraph>
                <Paragraph
                  type={"secondary"}
                  style={{ marginTop: "-15px", marginBottom: "-5px" }}
                >
                  为密钥设置一个易于识别的名称
                </Paragraph>
              </Col>

              <Col span={24}>
                <Form.Item
                  style={{ marginBottom: "0px", marginTop: "10px" }}
                  name="name"
                  rules={[
                    { required: true, message: "请输入密钥名称。" },
                  ]}
                >
                  <Input placeholder={`例如："AWS服务器"`} />
                </Form.Item>
              </Col>
            </Row>

            <Row style={{ marginTop: "24px" }} justify={"space-between"}>
              <Col span={18}>
                <Paragraph
                  style={{
                    whiteSpace: "pre-line",
                    margin: 0,
                    fontWeight: "500",
                  }}
                >
                  可重复使用
                </Paragraph>
                <Paragraph
                  type={"secondary"}
                  style={{ whiteSpace: "pre-line", margin: 0 }}
                >
                  使用此类型注册多个设备
                </Paragraph>
              </Col>
              <Col span={6}>
                <Row justify={"end"}>
                  <Form.Item name="reusable" valuePropName="checked">
                    <Switch
                      size="small"
                      onChange={(checked) => {
                        setFormSetupKey({
                          ...formSetupKey,
                          type: checked ? "reusable" : "one-off",
                        });
                      }}
                    />
                  </Form.Item>
                </Row>
              </Col>
            </Row>

            <Row style={{ marginTop: "16px" }}>
              <Col span={24}>
                <Paragraph
                  style={{
                    whiteSpace: "pre-line",
                    margin: 0,
                    fontWeight: "500",
                  }}
                >
                  使用限制
                </Paragraph>
              </Col>

              <Col>
                <Form.Item
                  name="usage_limit"
                  rules={[
                    {
                      pattern: new RegExp(/(^unlimited$|[0-9])/),
                      message: "请输入正确的使用限制。",
                    },
                  ]}
                >
                  <Input
                    type={"text"}
                    style={{ marginTop: "5px", width: "112px" }}
                    disabled={setupKey.id || formSetupKey.type !== "reusable"}
                  />
                </Form.Item>
                <Paragraph
                  type={"secondary"}
                  style={{ marginTop: "-18px", marginBottom: 0 }}
                >
                  例如，如果要注册30个设备，请将其设置为30
                </Paragraph>
              </Col>
            </Row>

            <Row style={{ marginTop: "24px" }}>
              <Col span={24}>
                <Paragraph
                  style={{
                    whiteSpace: "pre-line",
                    margin: 0,
                    fontWeight: "500",
                  }}
                >
                  过期时间
                </Paragraph>
              </Col>
              <Col>
                <Form.Item
                  name="expires_in"
                  rules={[
                    {
                      type: "number",
                      min: 1,
                      max: 365,
                      message:
                        "过期时间应设置在1到365天之间",
                    },
                    { required: true, message: "请输入过期日期" },
                  ]}
                >
                  <InputNumber
                    placeholder={`2`}
                    type="number"
                    addonAfter=" 天"
                    value={setupKey.expires_in}
                    style={{ width: "160px", marginTop: "5px" }}
                  />
                </Form.Item>
                <Paragraph
                  type={"secondary"}
                  style={{ marginTop: "-18px", marginBottom: 0 }}
                >
                  应设置在1到365天之间
                </Paragraph>
              </Col>
            </Row>

            <Row style={{ marginTop: "24px" }} justify={"space-between"}>
              <Col span={18}>
                <Paragraph
                  style={{
                    whiteSpace: "pre-line",
                    margin: 0,
                    fontWeight: "500",
                  }}
                >
                  临时设备
                </Paragraph>
                <Paragraph
                  type={"secondary"}
                  style={{ whiteSpace: "pre-line", margin: 0 }}
                >
                  超过10分钟离线的设备将被自动移除
                </Paragraph>
              </Col>
              <Col span={6}>
                <Row justify={"end"}>
                  <Form.Item name="ephemeral" valuePropName="checked">
                    <Switch
                      size="small"
                      onChange={(checked) => {
                        setFormSetupKey({
                          ...formSetupKey,
                          ephemeral: checked,
                        });
                      }}
                    />
                  </Form.Item>
                </Row>
              </Col>
            </Row>

            <Row style={{ marginTop: "24px" }}>
              <Col span={24}>
                <Paragraph
                  style={{
                    whiteSpace: "pre-line",
                    margin: 0,
                    fontWeight: "500",
                  }}
                >
                  自动分配的设备组
                </Paragraph>
                <Text type={"secondary"}>
                  这些设备组将自动分配给使用此密钥注册的设备
                </Text>
              </Col>
              <Col span={24}>
                <Form.Item
                  style={{ marginTop: "5px", marginBottom: 0 }}
                  name="autoGroupNames"
                >
                  <Select
                    mode="tags"
                    style={{ width: "100%" }}
                    placeholder="与密钥关联的设备组"
                    tagRender={blueTagRender}
                    dropdownRender={dropDownRender}
                    // 仅在新密钥 !setupkey.id 或密钥有效时启用
                    disabled={!(!setupKey.id || setupKey.valid)}
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
            </Row>
            <Row style={{ marginTop: "24px", marginBottom: "24px" }}>
              <Text type={"secondary"}>
                了解更多关于
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://docs.netbird.io/how-to/register-machines-using-setup-keys"
                >
                  {" "}
                  设置密钥
                </a>
              </Text>
            </Row>
          </Form>
        )}
        {showPlainToken && (
          <Input
            style={{ marginTop: "-15px", marginBottom: "25px" }}
            suffix={
              !tokenCopied ? (
                <Button
                  type="text"
                  size="middle"
                  className="btn-copy-code"
                  icon={<CopyOutlined />}
                  style={{ color: "rgb(107, 114, 128)", marginTop: "-1px" }}
                  onClick={() => onCopyClick(plainToken, true)}
                />
              ) : (
                <Button
                  type="text"
                  size="middle"
                  className="btn-copy-code"
                  icon={<CheckOutlined />}
                  style={{ color: "green", marginTop: "-1px" }}
                />
              )
            }
            defaultValue={plainToken}
            readOnly={true}
          ></Input>
        )}
      </Container>
    </Modal>
  );
};

export default SetupKeyNew;
