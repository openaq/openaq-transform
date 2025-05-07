import { parse } from 'csv-parse/sync';

export const json = async ({ text }) => {
    if(typeof(text) === 'string') {
        return JSON.parse(text);
    } else {
        return text;
    }
};

export const csv = async ({ text }) => {
    if(typeof(text) === 'string') {
        return parse(text, {
            columns: true,
            skip_empty_lines: true
        });
    } else {
        return text;
    }
};
