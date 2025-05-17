import { createClient } from 'redis';

export const redisClient = createClient({
  url: 'redis://default:VO75LdvzyAWzS7TifuMxDZwH6XEMxXsc@redis-17345.crce194.ap-seast-1-1.ec2.redns.redis-cloud.com:17345',
});