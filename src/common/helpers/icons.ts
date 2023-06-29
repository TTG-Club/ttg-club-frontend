import ids from 'virtual:svg-icons-names';
import sortBy from 'lodash/sortBy';

export const icons = sortBy(ids.map(icon => icon.replace('ttg-', '')));
