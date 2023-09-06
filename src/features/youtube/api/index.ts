import type { MaybeRef } from '@vueuse/core';
import fromPairs from 'lodash/fromPairs';
import { toPairs } from 'lodash';
import { toValue } from '@vueuse/shared';
import type { IOrderItem, IPaginatedResponse } from '@/types/Shared/BaseApiFields.types';
import { useAxios } from '@/common/composition/useAxios';
import type { TYoutubeVideo } from '@/features/youtube/types/Youtube.types';
import type { RequestConfig } from '@/common/services/HTTPService';
import { getOrderString } from '@/common/helpers/request';
import type { Maybe } from '@/types/Shared/Utility.types';
import type { TYoutubeVideoCreate } from '@/features/youtube/components/YoutubeAddVideo.vue';

export class YoutubeApi {
  static async load(payload: MaybeRef<{
    page?: MaybeRef<number>;
    limit?: MaybeRef<number>;
    order?: MaybeRef<Array<IOrderItem>>;
    activeStatus?: MaybeRef<boolean>;
  }>): Promise<IPaginatedResponse<TYoutubeVideo>> {
    try {
      const http = useAxios();

      const config: RequestConfig['payload'] = {
        page: 0,
        limit: -1,
        ...fromPairs(toPairs(toValue(payload))
          .map(([key, value]) => {
            const _value = toValue(value);

            if (key === 'order') {
              return [key, getOrderString(_value as Array<IOrderItem>)];
            }

            return [key, _value];
          }))
      };

      const { data } = await http.get<IPaginatedResponse<TYoutubeVideo>>({
        url: '/youtube',
        payload: config
      });

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  static async add(video: MaybeRef<TYoutubeVideoCreate>): Promise<TYoutubeVideo> {
    const http = useAxios();
    const _video = toValue(video);

    try {
      const { data } = await http.post<TYoutubeVideo>({
        url: '/youtube',
        payload: _video
      });

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  static async edit(video: MaybeRef<TYoutubeVideo>): Promise<TYoutubeVideo> {
    const http = useAxios();
    const _video = toValue(video);

    try {
      const { data } = await http.patch<TYoutubeVideo>({
        url: '/youtube',
        payload: _video
      });

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  static async remove(id: MaybeRef<TYoutubeVideo['id']>): Promise<void> {
    const _id = toValue(id);

    if (!_id) {
      return Promise.reject(new Error('You must specify the ID'));
    }

    const http = useAxios();

    try {
      await http.delete({ url: `/youtube?id=${ _id }` });

      // eslint-disable-next-line consistent-return
    } catch (err) {
      return Promise.reject(err);
    }
  }

  static async getCount(active?: Maybe<MaybeRef<boolean>>): Promise<number> {
    const http = useAxios();
    const _active = toValue(active);

    try {
      const { data } = await http.get<number>({
        url: '/youtube/count',
        payload: { active: _active }
      });

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  static async changeStatus(id: MaybeRef<TYoutubeVideo['id']>, status: MaybeRef<boolean>): Promise<TYoutubeVideo> {
    const _id = toValue(id);
    const _status = toValue(status);
    const http = useAxios();

    try {
      const { data } = await http.patch<TYoutubeVideo>({
        url: `/youtube/active?id=${ _id }&activeStatus=${ _status }`
      });

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  }
}
