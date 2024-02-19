import { toValue } from '@vueuse/shared';
import { fromPairs, toPairs } from 'lodash-es';

import { httpClient, type RequestConfig } from '@/shared/api';
import type {
  IOrderItem,
  IPaginatedResponse,
} from '@/shared/types/BaseApiFields';
import type { Maybe } from '@/shared/types/Utility';
import { getOrderString } from '@/shared/utils/request';

import type { TYoutubeVideoCreate } from '@/features/youtube/components/YoutubeAddVideo.vue';
import type { TYoutubeVideo } from '@/features/youtube/types/Youtube';

import type { MaybeRef } from '@vueuse/core';

export class YoutubeApi {
  static async load(
    payload: MaybeRef<{
      page?: MaybeRef<number>;
      size?: MaybeRef<number>;
      order?: MaybeRef<Array<IOrderItem>>;
      activeStatus?: MaybeRef<boolean>;
    }>,
  ): Promise<IPaginatedResponse<TYoutubeVideo>> {
    try {
      const config: RequestConfig['payload'] = {
        page: 0,
        size: -1,
        ...fromPairs(
          toPairs(toValue(payload)).map(([key, value]) => {
            const _value = toValue(value);

            if (key === 'order') {
              return [key, getOrderString(_value as Array<IOrderItem>)];
            }

            return [key, _value];
          }),
        ),
      };

      const { data } = await httpClient.get<IPaginatedResponse<TYoutubeVideo>>({
        url: '/youtube',
        payload: config,
      });

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  static async add(
    video: MaybeRef<TYoutubeVideoCreate>,
  ): Promise<TYoutubeVideo> {
    const _video = toValue(video);

    try {
      const { data } = await httpClient.post<TYoutubeVideo>({
        url: '/youtube',
        payload: _video,
      });

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  static async edit(video: MaybeRef<TYoutubeVideo>): Promise<TYoutubeVideo> {
    const _video = toValue(video);

    try {
      const { data } = await httpClient.patch<TYoutubeVideo>({
        url: '/youtube',
        payload: _video,
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

    try {
      await httpClient.delete({ url: `/youtube?id=${_id}` });

      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }

  static async getCount(active?: Maybe<MaybeRef<boolean>>): Promise<number> {
    const _active = toValue(active);

    try {
      const { data } = await httpClient.get<number>({
        url: '/youtube/count',
        payload: { active: _active },
      });

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  static async changeStatus(
    id: MaybeRef<TYoutubeVideo['id']>,
    status: MaybeRef<boolean>,
  ): Promise<TYoutubeVideo> {
    const _id = toValue(id);
    const _status = toValue(status);

    try {
      const { data } = await httpClient.patch<TYoutubeVideo>({
        url: `/youtube/active?id=${_id}&activeStatus=${_status}`,
      });

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  }
}
