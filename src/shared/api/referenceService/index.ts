import { httpClient } from '@/shared/api/httpClient';

import type { ReferenceDice } from './types';

enum ReferenceApi {
  SIZES = 'sizes',
  ENVIRONMENTS = 'environments',
  DICES = 'dices',
  DAMAGE_TYPES = 'damage/types',
  CONDITIONS = 'conditions',
  BEAST_TYPES = 'beast/types',
  ARMOR_TYPES = 'armor/types',
  ALIGNMENTS = 'alignments',
}

class ReferenceService {
  private getUrl = (path: ReferenceApi) => `/reference/${path}`;

  getSizes = async () => {
    try {
      const { data } = await httpClient.get<Array<ReferenceDice>>({
        version: 'v2',
        url: this.getUrl(ReferenceApi.SIZES),
      });

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  getEnvironments = async () => {
    try {
      const { data } = await httpClient.get<Array<ReferenceDice>>({
        version: 'v2',
        url: this.getUrl(ReferenceApi.ENVIRONMENTS),
      });

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  getDices = async () => {
    try {
      const { data } = await httpClient.get<Array<ReferenceDice>>({
        version: 'v2',
        url: this.getUrl(ReferenceApi.DICES),
      });

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  getDamageTypes = async () => {
    try {
      const { data } = await httpClient.get<Array<ReferenceDice>>({
        version: 'v2',
        url: this.getUrl(ReferenceApi.DAMAGE_TYPES),
      });

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  getConditions = async () => {
    try {
      const { data } = await httpClient.get<Array<ReferenceDice>>({
        version: 'v2',
        url: this.getUrl(ReferenceApi.CONDITIONS),
      });

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  getBeastTypes = async () => {
    try {
      const { data } = await httpClient.get<Array<ReferenceDice>>({
        version: 'v2',
        url: this.getUrl(ReferenceApi.BEAST_TYPES),
      });

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  getArmorTypes = async () => {
    try {
      const { data } = await httpClient.get<Array<ReferenceDice>>({
        version: 'v2',
        url: this.getUrl(ReferenceApi.ARMOR_TYPES),
      });

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  getAlignments = async () => {
    try {
      const { data } = await httpClient.get<Array<ReferenceDice>>({
        version: 'v2',
        url: this.getUrl(ReferenceApi.ALIGNMENTS),
      });

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  };
}

export const referenceService = new ReferenceService();
