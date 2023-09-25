import React, { useState } from "react";

import { Button, Divider, Row, Tooltip, Typography } from "antd";
import TabSteps from "./TabSteps";
import { StepCommand } from "./types";
import { formatNetBirdUP } from "./common";
import { Collapse } from "antd";
import SyntaxHighlighter from "react-syntax-highlighter";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { CheckOutlined, CopyOutlined } from "@ant-design/icons";
import { copyToClipboard } from "../../../../utils/common";
import { getConfig } from "../../../../config";
const { grpcApiOrigin } = getConfig();

const { Panel } = Collapse;

const { Text } = Typography;

export const LinuxTab = () => {
  const [copied, setCopied] = useState(false);
  const [quickSteps, setQuickSteps] = useState([
    {
      key: 1,
      title: (
        <Row>
          <Text>下载并运行 MacOS 安装程序：</Text>
          <Tooltip
            title={
              <text>
                如果您不知道您的 Mac 使用的芯片类型，可以点击屏幕左上角的苹果图标，选择“关于本机”查看。详细信息请点击{" "}
                <a
                  href="https://support.apple.com/en-us/HT211814"
                  target="_blank"
                >
                  这里
                </a>
              </text>
            }
            className={"ant-form-item-tooltip"}
          >
            <QuestionCircleOutlined
              style={{
                color: "rgba(0, 0, 0, 0.45)",
                cursor: "help",
                marginLeft: "3px",
              }}
            />
          </Tooltip>
        </Row>
      ),
      commands: (
        <Row style={{ paddingTop: "5px" }}>
          <Button
            data-testid="download-intel-button"
            style={{ marginRight: "10px" }}
            type="primary"
            href="https://pkgs.netbird.io/macos/amd64"
          >
            下载 Intel 版本
          </Button>
          <Button
            data-testid="download-m1-m2-button"
            style={{ marginRight: "10px" }}
            type="default"
            href="https://pkgs.netbird.io/macos/arm64"
          >
            下载 M1 & M2 版本
          </Button>
        </Row>
      ),
      copied: false,
    } as StepCommand,
    ...grpcApiOrigin
      ? [
          {
            key: 2,
            title: '点击系统托盘上的 NetBird 图标中的 "设置"，并输入以下 "管理 URL"',
            commands: grpcApiOrigin,
            commandsForCopy: grpcApiOrigin,
            copied: false,
            showCopyButton: false,
          },
        ]
      : [],
    {
      key: 2 + (grpcApiOrigin ? 1 : 0),
      title: '点击系统托盘上的 NetBird 图标中的 "连接"',
      commands: "",
      copied: false,
      showCopyButton: false,
    },
    {
      key: 3 + (grpcApiOrigin ? 1 : 0),
      title: "使用您的电子邮件地址进行注册",
      commands: "",
      copied: false,
      showCopyButton: false,
    },
  ]);

  const [steps, setSteps] = useState([
    {
      key: 1,
      title: "下载并安装 Homebrew",
      commands: (
        <Button
          style={{ marginTop: "5px" }}
          type="primary"
          href="https://brew.sh/"
          target="_blank"
        >
          下载 Brew
        </Button>
      ),
      copied: false,
    } as StepCommand,
    {
      key: 2,
      title: "安装 NetBird：",
      commands: [
        `# 仅 CLI 版本`,
        `brew install netbirdio/tap/netbird`,
        `# GUI 版本`,
        `brew install --cask netbirdio/tap/netbird-ui`,
      ].join("\n"),
      commandsForCopy: [
        `brew install netbirdio/tap/netbird`,
        `brew install --cask netbirdio/tap/netbird-ui`,
      ].join("\n"),
      copied: false,
      showCopyButton: true,
    } as StepCommand,
    {
      key: 3,
      title: "启动 NetBird 守护进程：",
      commands: [
        `sudo netbird service install`,
        `sudo netbird service start`,
      ].join("\n"),
      commandsForCopy: [
        `sudo netbird service install`,
        `sudo netbird service start`,
      ].join("\n"),
      copied: false,
      showCopyButton: true,
    } as StepCommand,
    {
      key: 4,
      title: "在浏览器中运行 NetBird 并登录：",
      commands: formatNetBirdUP(),
      commandsForCopy: formatNetBirdUP(),
      copied: false,
      showCopyButton: true,
    } as StepCommand,
  ]);

  const onCopyClick = () => {
    const stringToCopy = "curl -fsSL https://pkgs.netbird.io/install.sh | sh";
    copyToClipboard(stringToCopy);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div style={{ marginTop: 10 }}>
      <Text style={{ fontWeight: "bold" }}>在 MacOS 上安装</Text>
      <div style={{ marginTop: 5, marginBottom: 5 }}>
        <TabSteps stepsItems={quickSteps} />
      </div>
      <div style={{ marginTop: 0 }} />
      {/*<Divider style={{marginTop: "5px"}} />*/}
      <Collapse bordered={false} style={{ backgroundColor: "unset" }}>
        <Panel
          className="CustomPopupCollapse"
          header={<Text strong={true}>或通过命令行安装</Text>}
          key="1"
        >
          <div style={{ marginLeft: "25px" }}>
            <Text style={{ fontWeight: "bold" }}>使用一条命令安装</Text>
            <div
              style={{
                fontSize: ".85em",
                marginTop: 5,
                marginBottom: 25,
                position: "relative",
              }}
            >
              {!copied ? (
                <Button
                  type="text"
                  size="middle"
                  className="btn-copy-code peer"
                  icon={<CopyOutlined />}
                  style={{ color: "rgb(107, 114, 128)", top: "0", zIndex: "3" }}
                  onClick={onCopyClick}
                />
              ) : (
                <Button
                  type="text"
                  size="middle"
                  className="btn-copy-code peer"
                  icon={<CheckOutlined />}
                  style={{ color: "green", top: "0", zIndex: "3" }}
                />
              )}
              <SyntaxHighlighter language="bash">
                curl -fsSL https://pkgs.netbird.io/install.sh | sh
              </SyntaxHighlighter>
            </div>
            <Text style={{ fontWeight: "bold" }}>
              或使用 HomeBrew 手动安装
            </Text>
            <div style={{ marginTop: 5 }}>
              <TabSteps stepsItems={steps} />
            </div>
          </div>
        </Panel>
      </Collapse>
    </div>
  );
};

export default LinuxTab;
