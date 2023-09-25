import React, { useState } from 'react';

import { Button, Image, Typography } from "antd";
import TabSteps from "./TabSteps";
import { StepCommand } from "./types";
import googleplay from '../../../../assets/google-play-badge.png';
import { getConfig } from "../../../../config";
const { grpcApiOrigin } = getConfig();

const { Text } = Typography;

export const AndroidTab = () => {

    const [steps, setSteps] = useState([
        {
            key: 1,
            title: '从Google Play商店下载并安装应用程序：',
            commands: (
                <a data-testid="download-android-button" href="https://play.google.com/store/apps/details?id=io.netbird.client" target="_blank">
                    <Image width="12em" preview={false} style={{ marginTop: "5px" }} src={googleplay} />
                </a>
            ),
            copied: false
        } as StepCommand,
        ...grpcApiOrigin ? [{
            key: 2,
            title: '点击“更改服务器”并输入以下“服务器”',
            commands: grpcApiOrigin,
            commandsForCopy: grpcApiOrigin,
            copied: false,
            showCopyButton: false
        }] : [],
        {
            key: 2 + (grpcApiOrigin ? 1 : 0),
            title: '点击屏幕中间的“连接”按钮',
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
                安装 Android 版本
            </Text>
            <div style={{ marginTop: 5 }}>
                <TabSteps stepsItems={steps} />
            </div>
        </div>
    );
};

export default AndroidTab;
