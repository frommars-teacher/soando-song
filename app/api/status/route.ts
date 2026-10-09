import {enabled,reply} from '@/lib/runtime';
export async function GET(){return reply({enabled:enabled()})}
