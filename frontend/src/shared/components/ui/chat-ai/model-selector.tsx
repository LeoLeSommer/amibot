import { X } from "lucide-react-native";
import React, {
  Children,
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
} from "react-native";

import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
} from "@/shared/components/ui/modal";

const ModelSelectorContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
} | null>(null);

const useModelSelector = () => {
  const context = React.useContext(ModelSelectorContext);
  if (!context) {
    throw new Error(
      "ModelSelector sub-components must be used inside <ModelSelector>",
    );
  }
  return context;
};

export type ModelSelectorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: "xs" | "sm" | "md" | "lg" | "full";
  children: ReactNode;
};

export const ModelSelector = ({
  open,
  onOpenChange,
  size = "md",
  children,
}: ModelSelectorProps) => {
  const childrenArray = Children.toArray(children);

  const triggerChildren: ReactNode[] = [];
  let contentElement: React.ReactElement | null = null;

  childrenArray.forEach((child) => {
    if (isValidElement(child) && child.type === ModelSelectorContent) {
      contentElement = child;
    } else {
      triggerChildren.push(child);
    }
  });

  return (
    <ModelSelectorContext.Provider value={{ open, onOpenChange }}>
      {triggerChildren}

      <Modal isOpen={open} onClose={() => onOpenChange(false)} size={size}>
        <ModalBackdrop />
        {contentElement}
      </Modal>
    </ModelSelectorContext.Provider>
  );
};

export type ModelSelectorTriggerProps = {
  asChild?: boolean;
} & ComponentProps<typeof Pressable>;

export const ModelSelectorTrigger = ({
  asChild = false,
  className,
  children,
  onPress: userOnPress,
  ...props
}: ModelSelectorTriggerProps) => {
  const { onOpenChange } = useModelSelector();

  const handlePress = (event: GestureResponderEvent) => {
    onOpenChange(true);
    userOnPress?.(event);
  };

  if (asChild && isValidElement(children)) {
    const child = children as React.ReactElement<{
      className?: string;
      onPress?: (event: GestureResponderEvent) => void;
    }>;
    return cloneElement(child, {
      onPress: handlePress,
      className: `${child.props.className || ""} ${className || ""}`.trim(),
    });
  }

  return (
    <Pressable
      accessibilityRole="button"
      className={`h-10 w-full flex-row items-center justify-between rounded-md border border-border bg-background px-3 ${className || ""}`}
      onPress={handlePress}
      {...props}
    >
      {children}
    </Pressable>
  );
};

export type ModelSelectorContentProps = Omit<
  ComponentProps<typeof ModalContent>,
  "children"
> & {
  title?: ReactNode;
  children?: ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "full";
};

export const ModelSelectorContent = ({
  title = "Model Selector",
  children,
  className,
  ...props
}: ModelSelectorContentProps) => (
  <ModalContent className={className} {...props}>
    <ModalHeader>
      <Text className="sr-only">{title}</Text>
      <ModalCloseButton>
        <X size={20} className="text-muted-foreground" />
      </ModalCloseButton>
    </ModalHeader>
    <ModalBody>{children}</ModalBody>
  </ModalContent>
);

export const ModelSelectorInput = ({
  className,
  ...props
}: ComponentProps<typeof TextInput>) => (
  <TextInput
    className={`h-12 border-b border-border px-4 text-base text-foreground placeholder:text-muted-foreground ${className || ""}`}
    {...props}
  />
);

export const ModelSelectorList = ({
  className,
  ...props
}: ComponentProps<typeof View>) => (
  <View className={`flex-1 ${className || "w-full"}`} {...props} />
);

export const ModelSelectorEmpty = ({
  label = "No models found.",
  className,
  ...props
}: ComponentProps<typeof View> & { label?: string }) => (
  <View
    className={`flex-1 items-center justify-center py-12 ${className || ""}`}
    {...props}
  >
    <Text className="text-muted-foreground">{label}</Text>
  </View>
);

export const ModelSelectorGroup = ({
  heading,
  children,
  className,
  ...props
}: ComponentProps<typeof View> & { heading?: string }) => (
  <View className={className} {...props}>
    {heading ? (
      <Text className="px-4 py-2 text-sm font-semibold text-muted-foreground">
        {heading}
      </Text>
    ) : null}
    {children}
  </View>
);

export const ModelSelectorItem = ({
  isSelected = false,
  children,
  className,
  ...props
}: ComponentProps<typeof Pressable> & { isSelected?: boolean }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected: isSelected }}
    className={`w-full flex-row items-center rounded-md px-4 py-3 ${
      isSelected ? "bg-accent" : "active:bg-muted"
    } ${className || ""}`}
    {...props}
  >
    {children}
  </Pressable>
);

export const ModelSelectorShortcut = ({
  className,
  ...props
}: ComponentProps<typeof View>) => (
  <View className={`ml-auto ${className || ""}`} {...props} />
);

export const ModelSelectorSeparator = ({
  className,
}: {
  className?: string;
}) => <View className={`mx-4 my-1 h-px bg-border ${className || ""}`} />;

export const ModelSelectorLogo = ({ provider }: { provider: string }) => (
  <View className="h-5 w-5 items-center justify-center rounded-full bg-muted">
    <Text className="text-[10px] font-medium text-foreground">
      {provider.slice(0, 2).toUpperCase()}
    </Text>
  </View>
);

export const ModelSelectorLogoGroup = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => <View className={`flex-row gap-1 ${className || ""}`}>{children}</View>;

export const ModelSelectorName = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <Text
    className={`ml-3 flex-1 text-left text-base text-foreground ${className || ""}`}
  >
    {children}
  </Text>
);
