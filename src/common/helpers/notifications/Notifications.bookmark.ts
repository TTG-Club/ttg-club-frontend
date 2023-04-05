import { toast } from '@/common/utils/ToastConfig';

export const notifyBookmarkUpdate = (deleted = false) => {
    const toastContent = deleted ? 'удалена' : 'добавлена';

    toast.success(`Закладка ${ toastContent }!`);
};
