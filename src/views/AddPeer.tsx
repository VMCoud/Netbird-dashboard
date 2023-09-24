import React, { useEffect, useState } from 'react';
import { useDispatch } from "react-redux";
import { Container } from "../components/Container";
import {
    Col,
    Row,
    Typography,
    Space,
    Tabs
} from "antd";

import OtherTab from "../components/popups/addpeer/addpeer/LinuxTab";
import UbuntuTab from "../components/popups/addpeer/addpeer/UbuntuTab";
import MacTab from "../components/popups/addpeer/addpeer/MacTab";
import WindowsTab from "../components/popups/addpeer/addpeer/WindowsTab";
const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

export const AddPeer = () => {
    const dispatch = useDispatch()

    const detectOS = () => {
        let os = 1;
        if (navigator.userAgent.indexOf("Win") !== -1) os = 2;
        if (navigator.userAgent.indexOf("Mac") !== -1) os = 3;
        if (navigator.userAgent.indexOf("X11") !== -1) os = 1;
        if (navigator.userAgent.indexOf("Linux") !== -1) os = 1;
        return os;
    }
    const [openTab, setOpenTab] = useState(detectOS);

    useEffect(() => {
    }, [])

    const onChangeTab = (key: string) => { };

    return (
        <>
            <Container style={{ paddingTop: "40px" }}>
                <Row>
                    <Col span={24}>
                        <Title level={4}>添加节点</Title>
                        <Paragraph>要开始使用 NetBird，只需安装应用并登录。</Paragraph>
                        <Space direction="vertical" size="large" style={{ display: 'flex' }}>
                            <Tabs defaultActiveKey={openTab.toString()} onChange={onChangeTab} tabPosition="top" animated={{ inkBar: true, tabPane: false }}>
                                <TabPane tab="Ubuntu" key="1">
                                    <UbuntuTab />
                                </TabPane>
                                <TabPane tab="Windows" key="2">
                                    <WindowsTab />
                                </TabPane>
                                <TabPane tab="MacOS" key="3">
                                    <MacTab />
                                </TabPane>
                                <TabPane tab="其他" key="4">
                                    <OtherTab />
                                </TabPane>
                            </Tabs>
                        </Space>
                    </Col>
                </Row>
            </Container>
        </>
    )
}

export default AddPeer;

