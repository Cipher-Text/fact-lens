import { describe, expect, it } from 'vitest';
import { isPrivateAddress } from './safe-fetch';

describe('isPrivateAddress', () => {
  it('refuses the private and reserved IPv4 ranges', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '169.254.169.254', '172.16.0.1', '192.168.1.1', '100.64.0.1', '0.0.0.0', '224.0.0.1']) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
  });

  it('refuses IPv6 addresses that carry a private IPv4 address, in every embedding', () => {
    for (const ip of [
      '::ffff:10.0.0.1',   // IPv4-mapped
      '::127.0.0.1',       // IPv4-compatible
      '::a9fe:a9fe',       // IPv4-compatible 169.254.169.254
      '64:ff9b::a9fe:a9fe', // NAT64 169.254.169.254
      '64:ff9b::7f00:1',   // NAT64 127.0.0.1
      '2002:7f00:1::',     // 6to4 127.0.0.1
      '2002:a9fe:a9fe::1', // 6to4 169.254.169.254
    ]) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
  });

  it('refuses the IPv6 ranges that are local, reserved or tunnelled', () => {
    for (const ip of ['::1', '::', 'fc00::1', 'fd12::1', 'fe80::1', 'fec0::1', 'ff02::1', '64:ff9b:1::1', '2001:0:4136:e378:8000:63bf:3fff:fdd2', '100::1']) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
  });

  it('lets public addresses through, including when they are embedded', () => {
    for (const ip of ['8.8.8.8', '93.184.216.34', '64:ff9b::808:808', '2002:808:808::', '2606:4700:4700::1111', '2a00:1450:4001::200e']) {
      expect(isPrivateAddress(ip), ip).toBe(false);
    }
  });
});
