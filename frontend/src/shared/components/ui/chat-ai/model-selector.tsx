import { Check } from "lucide-react-native";
import React, {
  Children,
  isValidElement,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from "react-native";

type ModelSelectorAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ModelSelectorContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchor: ModelSelectorAnchor | null;
  setAnchor: (anchor: ModelSelectorAnchor | null) => void;
};

const ModelSelectorContext =
  React.createContext<ModelSelectorContextValue | null>(null);

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
  children: ReactNode;
};

export const ModelSelector = ({
  open,
  onOpenChange,
  children,
}: ModelSelectorProps) => {
  const [anchor, setAnchor] = useState<ModelSelectorAnchor | null>(null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

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

  const contextValue = useMemo(
    () => ({ open, onOpenChange, anchor, setAnchor }),
    [open, onOpenChange, anchor],
  );

  const panel = useMemo(() => {
    if (!anchor) {
      return null;
    }

    const width = Math.min(Math.max(anchor.width, 240), windowWidth - 24);
    const left = Math.min(
      Math.max(anchor.x, 12),
      Math.max(12, windowWidth - width - 12),
    );
    const bottom = Math.max(12, windowHeight - anchor.y + 8);
    const maxHeight = Math.max(160, anchor.y - 16);

    return { bottom, left, maxHeight, width };
  }, [anchor, windowHeight, windowWidth]);

  return (
    <ModelSelectorContext.Provider value={contextValue}>
      {triggerChildren}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => onOpenChange(false)}
      >
        <Pressable
          className="flex-1"
          accessible={false}
          onPress={() => onOpenChange(false)}
        >
          {panel ? (
            <Pressable
              accessibilityRole="menu"
              onPress={(event: GestureResponderEvent) =>
                event.stopPropagation()
              }
              className="absolute overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
              style={{
                bottom: panel.bottom,
                left: panel.left,
                maxHeight: panel.maxHeight,
                width: panel.width,
              }}
            >
              {contentElement}
            </Pressable>
          ) : null}
        </Pressable>
      </Modal>
    </ModelSelectorContext.Provider>
  );
};

export type ModelSelectorTriggerProps = ComponentProps<typeof Pressable>;

export const ModelSelectorTrigger = ({
  className,
  children,
  onPress: userOnPress,
  ...props
}: ModelSelectorTriggerProps) => {
  const { open, onOpenChange, setAnchor } = useModelSelector();
  const triggerRef = useRef<View>(null);

  const handlePress = (event: GestureResponderEvent) => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ height, width, x, y });
    });
    onOpenChange(!open);
    userOnPress?.(event);
  };

  return (
    <Pressable
      ref={triggerRef}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      className={`h-9 min-w-0 shrink flex-row items-center gap-1 overflow-hidden rounded-full px-3 active:bg-accent ${className || ""}`}
      onPress={handlePress}
      {...props}
    >
      {children}
    </Pressable>
  );
};

export type ModelSelectorContentProps = {
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export const ModelSelectorContent = ({
  title,
  children,
  className,
}: ModelSelectorContentProps) => (
  <View className={`flex-col p-1 ${className || ""}`}>
    {title ? (
      <Text className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </Text>
    ) : null}
    {children}
  </View>
);

export const ModelSelectorInput = ({
  className,
  ...props
}: ComponentProps<typeof TextInput>) => (
  <TextInput
    className={`mx-1 my-1 h-9 rounded-md bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground ${className || ""}`}
    {...props}
  />
);

export const ModelSelectorList = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <ScrollView
    showsVerticalScrollIndicator={false}
    keyboardShouldPersistTaps="handled"
    className={`max-h-60 ${className || ""}`}
  >
    {children}
  </ScrollView>
);

export const ModelSelectorEmpty = ({
  label = "No models found.",
  className,
  ...props
}: ComponentProps<typeof View> & { label?: string }) => (
  <View
    className={`items-center justify-center px-3 py-8 ${className || ""}`}
    {...props}
  >
    <Text className="text-sm text-muted-foreground">{label}</Text>
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
      <Text className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
    accessibilityRole="menuitem"
    accessibilityState={{ selected: isSelected }}
    className={`w-full flex-row items-center gap-2 rounded-md px-3 py-2.5 ${
      isSelected ? "bg-accent" : "active:bg-muted"
    } ${className || ""}`}
    {...props}
  >
    {children}
    {isSelected ? <Check size={16} className="ml-auto text-primary" /> : null}
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
}) => <View className={`mx-1 my-1 h-px bg-border ${className || ""}`} />;

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
    className={`flex-1 text-left text-base text-foreground ${className || ""}`}
  >
    {children}
  </Text>
);
