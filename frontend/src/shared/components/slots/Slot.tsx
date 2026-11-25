import { Platform } from "react-native";

import { visibleContributions, type SlotPlatform } from "./contributions";
import { useSlotContext } from "./SlotProvider";

export type SlotProps = {
  name: string;
};

function currentPlatform(): SlotPlatform {
  if (Platform.OS === "ios") {
    return "ios";
  }
  if (Platform.OS === "android") {
    return "android";
  }
  return "web";
}

export default function Slot({ name }: SlotProps) {
  const { slots, catalogue } = useSlotContext();
  const contributions = visibleContributions(
    slots[name] ?? [],
    currentPlatform(),
  );

  return (
    <>
      {contributions.map((contribution) => {
        const Component = catalogue[contribution.component];
        if (!Component) {
          if (__DEV__) {
            console.warn(
              `Unknown slot component "${contribution.component}" from ${contribution.module}`,
            );
          }
          return null;
        }

        return (
          <Component
            key={`${contribution.module}:${contribution.id}`}
            props={contribution.props}
            module={contribution.module}
            contributionId={contribution.id}
          />
        );
      })}
    </>
  );
}
