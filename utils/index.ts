export * from './common';
export { default as getStripe } from './getStripe';

export function pretty(x: any) {
    return JSON.stringify(x, null, 4)
}
