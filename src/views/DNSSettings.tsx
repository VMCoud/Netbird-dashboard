import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "typesafe-actions";
import {
  Button,
  Card,
  Col,
  Form,
  message,
  Row,
  Select,
  Space,
  Typography,
  SelectProps,
} from "antd";
import { useGetTokenSilently } from "../utils/token";
import { useGetGroupTagHelpers } from "../utils/groups";
import { actions as dnsSettingsActions } from "../store/dns-settings";
import { DNSSettings, DNSSettingsToSave } from "../store/dns-settings/types";
import { actions as nsGroupActions } from "../store/nameservers";

const { Paragraph } = Typography;
const styleNotification = { marginTop: 85 };
const { Option } = Select;
export const DNSSettingsForm = () => {
  const { getTokenSilently } = useGetTokenSilently();
  const dispatch = useDispatch();

  const {
    blueTagRender,
    handleChangeTags,
    dropDownRender,
    optionRender,
    tagGroups,
    getExistingAndToCreateGroupsLists,
    getGroupNamesFromIDs,
    selectValidatorEmptyStrings,
  } = useGetGroupTagHelpers();

  const dnsSettings = useSelector(
    (state: RootState) => state.dnsSettings.dnsSettings
  );
  const dnsSettingsData = useSelector(
    (state: RootState) => state.dnsSettings.data
  );
  const savedDNSSettings = useSelector(
    (state: RootState) => state.dnsSettings.savedDNSSettings
  );
  const loading = useSelector((state: RootState) => state.dnsSettings.loading);

  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(
      dnsSettingsActions.getDNSSettings.request({
        getAccessTokenSilently: getTokenSilently,
        payload: null,
      })
    );
  }, []);

  useEffect(() => {
    if (!dnsSettingsData) return;
    dispatch(
      dnsSettingsActions.setDNSSettings({
        disabled_management_groups: dnsSettingsData.disabled_management_groups,
      })
    );
  }, [dnsSettingsData]);

  useEffect(() => {
    form.setFieldsValue(dnsSettings);
  }, [dnsSettings]);

  const createKey = "saving";
  useEffect(() => {
    if (savedDNSSettings.loading) {
      message.loading({
        content: "保存中...",
        key: createKey,
        duration: 0,
        style: styleNotification,
      });
    } else if (savedDNSSettings.success) {
      message.success({
        content: "DNS设置已成功保存。",
        key: createKey,
        duration: 2,
        style: styleNotification,
      });
      dispatch(
        dnsSettingsActions.setSavedDNSSettings({
          ...savedDNSSettings,
          success: false,
        })
      );
      dispatch(dnsSettingsActions.resetSavedDNSSettings(null));
    } else if (savedDNSSettings.error) {
      let errorMsg = "更新DNS设置失败";
      switch (savedDNSSettings.error.statusCode) {
        case 403:
          errorMsg = "更新DNS设置失败。您可能没有足够的权限。";
          break;
        default:
          errorMsg = savedDNSSettings.error.data.message
            ? savedDNSSettings.error.data.message
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
        dnsSettingsActions.setSavedDNSSettings({
          ...savedDNSSettings,
          error: null,
        })
      );
      dispatch(nsGroupActions.resetSavedNameServerGroup(null));
    }
  }, [savedDNSSettings]);

  const handleFormSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        let dnsSettingsToSave = createDNSSettingsToSave(values);
        dispatch(
          dnsSettingsActions.saveDNSSettings.request({
            getAccessTokenSilently: getTokenSilently,
            payload: dnsSettingsToSave,
          })
        );
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

  const createDNSSettingsToSave = (values: DNSSettings): DNSSettingsToSave => {
    let [existingGroups, newGroups] = getExistingAndToCreateGroupsLists(
      values.disabled_management_groups
    );
    return {
      disabled_management_groups: existingGroups,
      groupsToCreate: newGroups,
    } as DNSSettingsToSave;
  };

  return (
    <>
      <Paragraph>管理您的帐户DNS设置</Paragraph>
      <Col>
        <Form
          name="basic"
          autoComplete="off"
          form={form}
          onFinish={handleFormSubmit}
        >
          <Space direction={"vertical"} style={{ display: "flex" }}>
            <Card loading={loading}>
              <div
                style={{
                  color: "rgba(0, 0, 0, 0.88)",
                  fontWeight: "500",
                  fontSize: "22px",
                  marginBottom: "20px",
                }}
              >
                DNS管理
              </div>
              <Row>
                <Col span={10}>
                  <label
                    style={{
                      color: "rgba(0, 0, 0, 0.88)",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    禁用以下组的DNS管理
                  </label>
                  <Paragraph
                    type={"secondary"}
                    style={{
                      marginTop: "-2",
                      fontWeight: "400",
                      marginBottom: "5px",
                    }}
                  >
                    这些组中的同行需要手动域名解析
                  </Paragraph>
                </Col>
              </Row>
              <Row>
                <Col span={8}>
                  <Form.Item
                    name="disabled_management_groups"
                    rules={[{ validator: selectValidatorEmptyStrings }]}
                  >
                    <Select
                      mode="tags"
                      style={{ width: "100%" }}
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
                  <Form.Item style={{ marginBottom: "0" }}>
                    <Button type="primary" htmlType="submit">
                      保存
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Space>
        </Form>
      </Col>
    </>
  );
};

export default DNSSettingsForm;
