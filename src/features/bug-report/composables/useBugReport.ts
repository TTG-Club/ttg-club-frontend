import { useLocalStorage } from '@vueuse/core';
import axios from 'axios';
import Cookies from 'js-cookie';
import { v4 as createUuid } from 'uuid';
import { ref, readonly } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';

import { ToastEventBus } from '@/shared/config';
import { USER_TOKEN_COOKIE } from '@/shared/const/UI';

import type {
  BugReportCreateRequest,
  TextSelection,
} from '@/features/bug-report/model';
import {
  BUG_REPORT_API_URL,
  BUG_REPORT_SUBMIT_ERROR_DESC,
  BUG_REPORT_SUBMIT_LIMIT_DESC,
  BUG_REPORT_SUBMIT_SUCCESS_DESC,
  SOURCE_PLATFORM,
} from '@/features/bug-report/model';

function formatSelectionText(selection: TextSelection): string {
  const prefix = selection.before ? `...${selection.before}` : '';
  const suffix = selection.after ? `${selection.after}...` : '';

  return `${prefix}[${selection.selected}]${suffix}`;
}

const isModalOpen = ref(false);
const screenshot = ref<Blob | null>(null);
const capturedPageUrl = ref('');
const textSelection = ref<TextSelection | null>(null);

export function useBugReport() {
  const route = useRoute();
  const toast = useToast(ToastEventBus);

  function openReport(): void {
    capturedPageUrl.value = window.location.origin + route.fullPath;
    isModalOpen.value = true;
  }

  function openReportWithSelection(selection: TextSelection): void {
    textSelection.value = selection;
    openReport();
  }

  function cancel(): void {
    isModalOpen.value = false;
    screenshot.value = null;
    capturedPageUrl.value = '';
    textSelection.value = null;
  }

  async function submit(
    description: string,
    screenshotBlob: Blob | null,
  ): Promise<boolean> {
    const userToken =
      Cookies.get('ttg-user-token') || Cookies.get(USER_TOKEN_COOKIE);

    console.log('[bug-report debug] Cookies check:', {
      'ttg-user-token': Cookies.get('ttg-user-token'),
      [USER_TOKEN_COOKIE]: Cookies.get(USER_TOKEN_COOKIE),
      'resolvedToken': userToken ? `${userToken.substring(0, 15)}...` : null,
    });

    const guestId = useLocalStorage('bug-report:guest-id', createUuid());

    const formattedSelectedText = textSelection.value
      ? formatSelectionText(textSelection.value)
      : undefined;

    const requestData: BugReportCreateRequest = {
      description,
      url: capturedPageUrl.value || undefined,
      sourcePlatform: SOURCE_PLATFORM,
      sessionId: userToken ? undefined : guestId.value,
      selectedText: formattedSelectedText,
    };

    const formData = new FormData();

    formData.append(
      'request',
      new Blob([JSON.stringify(requestData)], { type: 'application/json' }),
    );

    if (screenshotBlob) {
      formData.append('screenshot', screenshotBlob, 'screenshot.png');
    }

    try {
      const headers: Record<string, string> = {};

      if (userToken) {
        headers.Authorization = `Bearer ${userToken}`;
      }

      await axios.post(BUG_REPORT_API_URL, formData, {
        headers,
        withCredentials: false,
      });

      toast.success(BUG_REPORT_SUBMIT_SUCCESS_DESC);

      cancel();

      return true;
    } catch (error) {
      console.error('Ошибка при отправке баг-репорта:', error);

      if (axios.isAxiosError(error) && error.response?.status === 429) {
        toast.error(BUG_REPORT_SUBMIT_LIMIT_DESC);
      } else {
        toast.error(BUG_REPORT_SUBMIT_ERROR_DESC);
      }

      return false;
    }
  }

  function setScreenshot(blob: Blob): void {
    screenshot.value = blob;
  }

  function clearScreenshot(): void {
    screenshot.value = null;
  }

  function clearTextSelection(): void {
    textSelection.value = null;
  }

  return {
    isModalOpen,
    screenshot: readonly(screenshot),
    capturedPageUrl: readonly(capturedPageUrl),
    textSelection: readonly(textSelection),

    openReport,
    openReportWithSelection,
    setScreenshot,
    clearScreenshot,
    clearTextSelection,
    cancel,
    submit,
  };
}
