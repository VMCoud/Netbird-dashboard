import React from 'react';
import { Layout } from 'antd';

const { Footer } = Layout

export default () => {
  return (
      <Footer style={{ textAlign: 'center',  bottom: "0"}}>
          Copyright © 2023 <a href="https://netbird.io">NetBird Authors</a>/由帅帅的南山汉化
      </Footer>
  );
};
