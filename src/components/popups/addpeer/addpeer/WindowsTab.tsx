import React, { useState } from 'react';

import { Button, Typography } from "antd";
import TabSteps from "./TabSteps";
import { StepCommand } from "./types";
import { getConfig } from "../../../../config";
const { grpcApiOrigin } = getConfig();

const { Text } = Typography;

export const WindowsTab = () => {

    const [steps, setSteps] = useState([
        {
            key: 1,
            title: '下载并运行 Windows 安装程序：',
            commands: (
                <Button data-testid="download-windows-button" style={{ marginTop: "5px" }} type="primary" href="https://pkgs.netbird.io/windows/x64" target="_blank">下载 NetBird</Button>
            ),
            copied: false
        } as StepCommand,
        ...grpcApiOrigin ? [{
            key: 2,
            title: '从系统托盘的 NetBird 图标中点击 "设置"，然后输入以下 "管理 URL"',
            commands: grpcApiOrigin,
            commandsForCopy: grpcApiOrigin,
            copied: false,
            showCopyButton: false
        }] : [],
        {
            key: 2 + (grpcApiOrigin ? 1 : 0),
            title: '从系统托盘的 NetBird 图标中点击 "连接"',
            commands: '',
            copied: false,
            showCopyButton: false
        },
        {
            key: 3 + (grpcApiOrigin ? 1 : 0),
            title: '使用您的电子邮件地址注册',
            commands: '',
            copied: false,
            showCopyButton: false
        }
    ]);

    return (
        <div style={{ marginTop: 10 }}>
            <Text style={{ fontWeight: "bold" }}>
                在 Windows 上安装
            </Text>
            <div style={{ marginTop: 5 }}>
                <TabSteps stepsItems={steps} />
            </div>

        </div>
    );
};

export default WindowsTab;
