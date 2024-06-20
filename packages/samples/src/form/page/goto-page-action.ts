import { defineConcept } from '@hayadev/configurator';
import { getAllPages } from '../util';

/**
 * 跳转至页面
 */
export const GoToPageAction = defineConcept({
    name: 'GoToPageAction',

    displayName: '跳转页面',

    items: {
        /**
         * 跳转页面
         */
        goToPage: {
            type: 'dynamic-select',
            name: '目标页面',
            inline: true,

            // 从root model获取所有页面
            provider: ({ rootModel }) => getAllPages(rootModel),
        },
    },
});
