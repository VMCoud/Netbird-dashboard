import { useOidc, useOidcUser } from "@axa-fr/react-oidc";
import { Anchor, Button, Col, Result, Row, Space } from "antd";
import React from "react";
import { getConfig } from "../config";
import { ResultStatusType } from "antd/lib/result";

const { Link } = Anchor;

function LoginError() {
  const { logout } = useOidc();
  const config = getConfig();
  const { oidcUserLoadingState } = useOidcUser();
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  if (urlParams.get("error") === "access_denied") {
    let title = urlParams.get("error_description");
    let status: ResultStatusType = "warning";
    
    // 这个信息来自于链接账户的 Auth0 规则
    if (title === "account linked successfully") {
      status = "success";
      title = "您的账户已成功链接。请重新登录以完成设置。";
    }

    return (
      <Result
        status={status}
        title={title}
        extra={
          <>
            <Space
              style={{
                display: "flex-inline",
                flexDirection: "column",
                justifyContent: "space-around",
                alignContent: "center",
              }}
            >
              <h4>已验证您的电子邮件地址？</h4>
              <a href={window.location.origin}>
                <Button type="primary">继续</Button>
              </a>

              <Button
                type="link"
                onClick={function () {
                  logout("", { client_id: config.clientId });
                }}
              >
                登录遇到问题？请重试。
              </Button>
            </Space>
          </>
        }
      />
    );
  }
  
  return <div>{"登录错误：用户状态：" + oidcUserLoadingState}</div>;
}

export default LoginError;
