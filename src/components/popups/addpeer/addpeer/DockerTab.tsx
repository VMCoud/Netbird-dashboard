import React, { useState } from 'react';
import { StepCommand } from "./types";
import { formatDockerCommand, formatNetBirdUP } from "./common";
import SyntaxHighlighter from "react-syntax-highlighter";
import TabSteps from "./TabSteps";
import { Button, Typography } from "antd";
import Link from "antd/lib/typography/Link";

const { Title, Paragraph, Text } = Typography;

export const DockerTab = () => {

  const [steps, setSteps] = useState([
    {
      key: 1,
      title: "安装 Docker",
      commands: (
        <Button
          data-testid="download-docker-button"
          style={{ marginTop: "5px" }}
          type="primary"
          href="https://docs.docker.com/engine/install/"
          target="_blank"
        >
          前往 Docker 官方网站
        </Button>
      ),
      copied: false,
      showCopyButton: false,
    } as StepCommand,
    {
      key: 2,
      title: "运行 NetBird 容器",
      commands: formatDockerCommand(),
      commandsForCopy: formatDockerCommand(),
      copied: false,
      showCopyButton: false,
    } as StepCommand,
    {
      key: 3,
      title: "阅读文档",
      commands: (
        <Link
          href="https://docs.netbird.io/how-to/getting-started#running-net-bird-in-docker"
          target="_blank"
        >
          在 Docker 中运行 NetBird
        </Link>
      ),
      copied: false,
      showCopyButton: false,
    } as StepCommand,
  ]);

  return (
    <div style={{ marginTop: 10 }}>
      {/*<Text style={{ fontWeight: "bold" }}>
                在 Docker 中运行
            </Text>
            <div style={{ fontSize: ".85em", marginTop: 5, marginBottom: 25 }}>
                <SyntaxHighlighter language="bash">
                    {formatDockerCommand()}
                </SyntaxHighlighter>
            </div>*/}
      <Text style={{ fontWeight: "bold" }}>
        在 Ubuntu 上安装
      </Text>
      <div style={{ marginTop: 5 }}>
        <TabSteps stepsItems={steps} />
      </div>
    </div>
  );
}

export default DockerTab;
