import React from "react";
import { Container } from "../components/Container";
import { Modal } from "antd";
import AddPeerPopup from "../components/popups/addpeer/addpeer/AddPeerPopup";


export const InstallPage = () => {
    return (
        <>
            <Container style={{ paddingTop: "40px" }}>
                <Modal
                    closable={false}
                    open={true}
                    footer={[]}
                    width={780}
                >
                    <AddPeerPopup
                        greeting={"嗨！"}
                        headline={"是时候添加你的第一个设备了。"}
                    />
                </Modal>
            </Container>
        </>
    );
};

export default InstallPage;
