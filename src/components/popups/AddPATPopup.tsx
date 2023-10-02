import {useGetTokenSilently} from "../../utils/token";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "typesafe-actions";
import {Button, Col, Divider, Form, Input, InputNumber, message, Modal, Row, Space, Typography} from "antd";
import {Container} from "../Container";
import {CheckOutlined, CopyOutlined, QuestionCircleFilled} from "@ant-design/icons";
import SyntaxHighlighter from "react-syntax-highlighter";
import React, {useEffect, useRef, useState} from "react";
import {actions as personalAccessTokenActions} from "../../store/personal-access-token";
import {PersonalAccessTokenCreate} from "../../store/personal-access-token/types";
import {copyToClipboard} from "../../utils/common";

const {Title, Text, Paragraph} = Typography;

const ExpiresInDefault = 30
const styleNotification = {marginTop: 85}

const AddPATPopup = () => {
    const {getTokenSilently} = useGetTokenSilently()
    const dispatch = useDispatch()

    const user = useSelector((state: RootState) => state.user.user)

    const addTokenModalOpen = useSelector((state: RootState) => state.personalAccessToken.newPersonalAccessTokenPopupVisible)
    const [confirmModal, confirmModalContextHolder] = Modal.useModal();
    const [showPlainToken, setShowPlainToken] = useState(false);
    const [tokenCopied, setTokenCopied] = useState(false);
    const [plainToken, setPlainToken] = useState("")
    const inputNameRef = useRef<any>(null)
    const [form] = Form.useForm()

    const savedPersonalAccessToken = useSelector((state: RootState) => state.personalAccessToken.savedPersonalAccessToken);

    const onCopyClick = (text: string, copied: boolean) => {
        copyToClipboard(text)
        setTokenCopied(true)
        if (copied) {
            setTimeout(() => {
                onCopyClick(text, false)
            }, 2000)
        }
    }

    const onCancel = () => {
        setShowPlainToken(false)
        setTokenCopied(false)
        if (savedPersonalAccessToken.loading) return
        dispatch(personalAccessTokenActions.setPersonalAccessToken({
            user_id: "",
            name: "",
            expires_in: 7
        } as PersonalAccessTokenCreate))
        form.resetFields()
        dispatch(personalAccessTokenActions.setNewPersonalAccessTokenPopupVisible(false));
        dispatch(personalAccessTokenActions.setSavedPersonalAccessToken({...savedPersonalAccessToken, success: false}));
        dispatch(personalAccessTokenActions.resetSavedPersonalAccessToken(null))
    }

    const handleFormSubmit = () => {
        form.validateFields()
            .then((values) => {
                let personalAccessTokenToSave = {
                    user_id: user.id,
                    name: values.name,
                    expires_in: values.expires_in,
                } as PersonalAccessTokenCreate
                dispatch(personalAccessTokenActions.savePersonalAccessToken.request({
                    getAccessTokenSilently: getTokenSilently,
                    payload: personalAccessTokenToSave
                }))
            })
            .catch((errorInfo) => {
                console.log('errorInfo', errorInfo)
            });
    };

    const createKey = 'saving';
    useEffect(() => {
        if (savedPersonalAccessToken.loading) {
            message.loading({content: '保存中...', key: createKey, duration: 0, style: styleNotification});
        } else if (savedPersonalAccessToken.success) {
            message.destroy(createKey)
            setPlainToken(savedPersonalAccessToken.data.plain_token)
            setShowPlainToken(true)
            form.resetFields()
        } else if (savedPersonalAccessToken.error) {
            message.error({
                content: '创建个人访问令牌失败。您可能没有足够的权限。',
                key: createKey,
                duration: 2,
                style: styleNotification
            });
            dispatch(personalAccessTokenActions.setNewPersonalAccessTokenPopupVisible(false));
            setShowPlainToken(false)
            setTokenCopied(false)
            dispatch(personalAccessTokenActions.setSavedPersonalAccessToken({...savedPersonalAccessToken, error: null}));
            dispatch(personalAccessTokenActions.resetSavedPersonalAccessToken(null))
        }
    }, [savedPersonalAccessToken])


    return (
        <>
            <Modal
                open={addTokenModalOpen}
                onCancel={onCancel}
                footer={
                    <Space style={{display: 'flex', justifyContent: 'end'}}>
                        {!showPlainToken && <Button disabled={savedPersonalAccessToken.loading} onClick={onCancel}>{"取消"}</Button>}
                        {!showPlainToken && <Button type="primary" disabled={showPlainToken}
                                onClick={handleFormSubmit}>{"创建令牌"}</Button>}
                        {showPlainToken && <Button type="primary" disabled={!showPlainToken} onClick={onCancel}>完成</Button>}
                    </Space>
                }
                width={460}
            >
                <Container style={{textAlign: "start", marginLeft: "-15px", marginRight: "-15px"}}>
                    <Paragraph
                        style={{textAlign: "start", whiteSpace: "pre-line", fontSize: "18px",fontWeight:"500"}}>
                        {showPlainToken ? "令牌创建成功！" : "创建令牌"}
                    </Paragraph>
                    {!showPlainToken && <Paragraph type={"secondary"}
                               style={{
                                   textAlign: "start",
                                   whiteSpace: "pre-line",
                                   marginTop: "-23px",
                                   paddingBottom: "25px",
                               }}>
                        {"使用此令牌访问NetBird的公共API"}
                    </Paragraph>}
                    {showPlainToken && <Paragraph type={"secondary"} style={{
                        textAlign: "start",
                        whiteSpace: "pre-line",
                        marginTop: "25px",
                    }}>{"此令牌不会再次显示，请确保将其复制并存储在安全的位置"}</Paragraph>}
                    {!showPlainToken && <Form layout="vertical" hideRequiredMark form={form}
                                              initialValues={{
                                                  expires_in: ExpiresInDefault,
                                              }}
                    >
                        <Row gutter={16}>
                            <Col span={24}>
                                <Row align="top">
                                    <Col flex="auto">
                                        <Paragraph style={{fontWeight: "500", marginTop: "-10px"}}>Name</Paragraph>
                                        <Paragraph type={"secondary"} style={{marginTop: "-15px"}}>Set an easily identifiable name for your token</Paragraph>
                                        <Form.Item
                                            name="name"
                                            style={{marginTop: "-10px"}}
                                            rules={[{
                                                required: true,
                                                message: '请为此令牌添加一个名称',
                                                whitespace: true
                                            }]}
                                        >
                                            <Input
                                                placeholder={"for example \"Infra token\""}
                                                ref={inputNameRef}
                                                autoComplete="off"/>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={24} style={{textAlign: "left", marginTop: "10px"}}>
                                <Paragraph style={{fontWeight: "500", marginTop: "-10px"}}>有效期至</Paragraph>
                                <Paragraph type={"secondary"} style={{marginTop: "-15px"}}>此令牌有效的天数</Paragraph>
                                <Form.Item
                                    name="expires_in"
                                    style={{marginTop: "-10px"}}
                                    rules={[{
                                        type: 'number',
                                        min: 1,
                                        max: 365,
                                        message: '过期时间应设置在1到365天之间。'
                                    }]}>
                                    <InputNumber addonAfter=" Days" style={{maxWidth: "150px"}}/>
                                </Form.Item>
                                <Paragraph type={"secondary"} style={{fontSize: "14px", marginTop: "-18px"}}>应在1到365天之间</Paragraph>
                            </Col>
                            <Col span={24} style={{marginTop: "15px"}}>
                                <Text type={"secondary"}>
                                    Learn more about
                                    <a
                                        target="_blank"
                                        rel="noreferrer"
                                        href="https://docs.netbird.io/how-to/access-netbird-public-api"
                                    >
                                        {" "}
                                        访问令牌
                                    </a>
                                </Text>
                            </Col>
                        </Row>
                    </Form>}
                    {showPlainToken &&
                                <Input style={{marginTop: "-15px", marginBottom: "25px"}} suffix={
                                    !tokenCopied ? <Button type="text" size="middle" className="btn-copy-code" icon={<CopyOutlined/>}
                                    style={{color: "rgb(107, 114, 128)", marginTop: "-1px"}}
                                    onClick={() => onCopyClick(plainToken, true)}/>
                                    : <Button type="text" size="middle"  className="btn-copy-code" icon={<CheckOutlined/>}
                                              style={{color: "green", marginTop: "-1px"}}/>
                                }
                                       defaultValue={plainToken}
                                       readOnly={true}
                                ></Input>}
                </Container>
            </Modal>
            {confirmModalContextHolder}
        </>
    )
}

export default AddPATPopup