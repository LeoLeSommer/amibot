import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Text, TextInput, View } from "react-native";

import { normalizeServerUrl } from "@/lib/api/serverUrl";
import { Button, ButtonText } from "@/shared/components/ui/button";

import useServerConfig from "../hooks/useServerConfig";
import { serverUrlSchema, type ServerUrlFormValues } from "../schema";

export default function ServerSettingsForm() {
  const { t } = useTranslation();
  const { serverUrl, isLoading, connect, disconnect } = useServerConfig();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<ServerUrlFormValues>({
    resolver: zodResolver(serverUrlSchema),
    defaultValues: { serverUrl: serverUrl ?? "" },
  });

  useEffect(() => {
    reset({ serverUrl: serverUrl ?? "" });
  }, [reset, serverUrl]);

  const submit = handleSubmit(async (values) => {
    const normalized = normalizeServerUrl(values.serverUrl);
    if (!normalized) {
      return;
    }
    await connect(normalized);
  });

  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text className="text-sm font-sans-medium text-foreground">
          {t("settings.urlLabel")}
        </Text>
        <Controller
          control={control}
          name="serverUrl"
          render={({ field: { onBlur, onChange, value } }) => (
            <TextInput
              testID="server-url-input"
              nativeID="server-url-input"
              className="rounded-lg border border-border bg-card px-3 py-2 text-base text-foreground"
              autoCapitalize="none"
              autoCorrect={false}
              inputMode="url"
              keyboardType="url"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder={t("settings.urlPlaceholder")}
              placeholderTextColor="#94A3B8"
            />
          )}
        />
        {errors.serverUrl?.message ? (
          <Text className="text-sm text-destructive">
            {t(errors.serverUrl.message)}
          </Text>
        ) : null}
      </View>

      <View className="flex-row gap-3">
        <Button
          testID="server-connect"
          nativeID="server-connect"
          onPress={() => void submit()}
          isDisabled={isLoading || isSubmitting}
        >
          <ButtonText>{t("settings.connect")}</ButtonText>
        </Button>

        {serverUrl ? (
          <Button
            testID="server-disconnect"
            nativeID="server-disconnect"
            variant="outline"
            onPress={() => void disconnect()}
            isDisabled={isLoading}
          >
            <ButtonText>{t("settings.disconnect")}</ButtonText>
          </Button>
        ) : null}
      </View>
    </View>
  );
}
