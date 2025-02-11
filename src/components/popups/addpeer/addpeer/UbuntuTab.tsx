import React, { useState } from "react";
import { StepCommand } from "./types";
import { formatNetBirdUP } from "./common";
import SyntaxHighlighter from "react-syntax-highlighter";
import TabSteps from "./TabSteps";
import { Typography, Button } from "antd";
import { CheckOutlined, CopyOutlined } from "@ant-design/icons";
import { copyToClipboard } from "../../../../utils/common";

const { Title, Paragraph, Text } = Typography;

export const UbuntuTab = () => {
  const [copied, setCopied] = useState(false);

  const [steps, setSteps] = useState([
    {
      key: 1,
      title: "添加仓库",
      commands: [
        `sudo apt-get update`,
        `sudo apt install ca-certificates curl gnupg -y`,
        `curl -sSL https://pkgs.netbird.io/debian/public.key | sudo gpg --dearmor --output /usr/share/keyrings/netbird-archive-keyring.gpg`,
        `echo 'deb [signed-by=/usr/share/keyrings/netbird-archive-keyring.gpg] https://pkgs.netbird.io/debian stable main' | sudo tee /etc/apt/sources.list.d/netbird.list`,
      ].join("\n"),
      commandsForCopy: [
        `sudo apt-get update`,
        `sudo apt-get install ca-certificates curl gnupg -y`,
        `curl -sSL https://pkgs.netbird.io/debian/public.key | sudo gpg --dearmor --output /usr/share/keyrings/netbird-archive-keyring.gpg`,
        `echo 'deb [signed-by=/usr/share/keyrings/netbird-archive-keyring.gpg] https://pkgs.netbird.io/debian stable main' | sudo tee /etc/apt/sources.list.d/netbird.list`,
      ].join("\n"),
      copied: false,
      showCopyButton: false,
    } as StepCommand,
    {
      key: 2,
      title: "安装NetBird",
      commands: [
        `sudo apt-get update`,
        `# 仅CLI`,
        `sudo apt-get install netbird`,
        `# GUI包`,
        `sudo apt-get install netbird-ui`,
      ].join("\n"),
      commandsForCopy: [
        `sudo apt-get update`,
        `sudo apt-get install netbird`,
        `sudo apt-get install netbird-ui`,
      ].join("\n"),
      copied: false,
      showCopyButton: false,
    } as StepCommand,
    {
      key: 3,
      title: "运行NetBird并在浏览器中登录",
      commands: formatNetBirdUP(),
      commandsForCopy: formatNetBirdUP(),
      copied: false,
      showCopyButton: false,
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
      <Text style={{ fontWeight: "bold" }}>一键安装</Text>
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
      <Text style={{ fontWeight: "bold" }}>或在Ubuntu上手动安装</Text>
      <div style={{ marginTop: 5 }}>
        <TabSteps stepsItems={steps} />
      </div>
    </div>
  );
};

export default UbuntuTab;
