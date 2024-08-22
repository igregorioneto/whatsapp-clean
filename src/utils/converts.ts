import Long from "long";

export const convertToNumber = (value: number | Long): number => {
    if (Long.isLong(value)) {
        return value.toNumber();
    }
    return value;
};

export const convertToTimestamp = (timestamp: number): Date => {
    return new Date(timestamp * 1000);
}