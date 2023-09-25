import { useState } from "react";

import { Button } from "antd";
import TabSteps from "./TabSteps";
import { StepCommand } from "./types";

export const OtherTab = () => {
  const [steps, _] = useState([
    {
      key: 1,
      title: "查看我们的文档以了解其他安装选项。",
      commands: (
        <Button
          type="primary"
          href={`https://docs.netbird.io/how-to/getting-started#binary-install`}
          target="_blank"
        >
          文档
        </Button>
      ),
      copied: false,
    } as StepCommand,
  ]);

  return <TabSteps stepsItems={steps} />;
};

export default OtherTab;
