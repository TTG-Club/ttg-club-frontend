import type { Maybe } from '@/types/Shared/Utility.types';
import { toast } from '@/common/utils/ToastConfig';

export const notifyBookmarkUpdate = (bookmark: Maybe<unknown>) => {
    const toastContent = bookmark ? 'добавлена' : 'удалена';

    toast.success(`Закладка ${ toastContent }!`);
};
