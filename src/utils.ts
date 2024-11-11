
export const stripNulls = <T extends object>(obj: T): { [K in keyof T]: T[K] } => {
    return Object.assign(
        {},
        ...Object.entries(obj)
            .filter(([_, v]) => ![null,NaN,'',undefined,'undefined'].includes(v))
            .map(([k, v]) => ({ [k]: v }))
    );
};

export const cleanKey = (value) => {
    return value && value
        .replace(/^[ ]+|[ ]+$/,'')
        .replace(/[ ]+/g,'_')
        .replace(/[^\w]/g,'')
        .toLowerCase();
};

export const stripWhitespace = (value) => {
    if (typeof(value) === 'string') {
        return value.replace(/^[ ]+|[ ]+$/,'');
    } else {
        return value;
    }
};