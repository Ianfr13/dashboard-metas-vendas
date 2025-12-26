import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('wrangler.jsonc Configuration', () => {
  let config: any;
  const configPath = resolve(process.cwd(), 'wrangler.jsonc');

  beforeAll(() => {
    // Read and parse JSONC (JSON with comments)
    const content = readFileSync(configPath, 'utf-8');
    // Remove comments and parse
    const jsonContent = content
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments
    config = JSON.parse(jsonContent);
  });

  describe('Configuration File Existence', () => {
    it('should have wrangler.jsonc file in root directory', () => {
      expect(existsSync(configPath)).toBe(true);
    });

    it('should be valid JSON/JSONC format', () => {
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });
  });

  describe('Worker Name Configuration', () => {
    it('should have a name property', () => {
      expect(config).toHaveProperty('name');
    });

    it('should have the correct worker name', () => {
      expect(config.name).toBe('dashboard-metas-vendas');
    });

    it('should use kebab-case for worker name', () => {
      expect(config.name).toMatch(/^[a-z0-9-]+$/);
    });

    it('should not contain spaces in worker name', () => {
      expect(config.name).not.toContain(' ');
    });

    it('should not use the old "dashboard" name', () => {
      expect(config.name).not.toBe('dashboard');
    });

    it('should match package.json name', () => {
      const packageJson = JSON.parse(
        readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8')
      );
      expect(config.name).toBe(packageJson.name);
    });
  });

  describe('Compatibility Configuration', () => {
    it('should have compatibility_date property', () => {
      expect(config).toHaveProperty('compatibility_date');
    });

    it('should have a valid date format for compatibility_date', () => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      expect(config.compatibility_date).toMatch(dateRegex);
    });

    it('should have compatibility_date as a string', () => {
      expect(typeof config.compatibility_date).toBe('string');
    });

    it('should have a valid date that can be parsed', () => {
      const date = new Date(config.compatibility_date);
      expect(date.toString()).not.toBe('Invalid Date');
    });

    it('should have compatibility_flags property', () => {
      expect(config).toHaveProperty('compatibility_flags');
    });

    it('should have compatibility_flags as an array', () => {
      expect(Array.isArray(config.compatibility_flags)).toBe(true);
    });

    it('should include nodejs_compat flag', () => {
      expect(config.compatibility_flags).toContain('nodejs_compat');
    });

    it('should not have empty compatibility_flags', () => {
      expect(config.compatibility_flags.length).toBeGreaterThan(0);
    });
  });

  describe('Entry Point Configuration', () => {
    it('should have main property', () => {
      expect(config).toHaveProperty('main');
    });

    it('should point to worker.ts', () => {
      expect(config.main).toBe('worker.ts');
    });

    it('should reference an existing file', () => {
      const mainPath = resolve(process.cwd(), config.main);
      expect(existsSync(mainPath)).toBe(true);
    });

    it('should use .ts extension for TypeScript', () => {
      expect(config.main).toMatch(/\.ts$/);
    });
  });

  describe('Assets Configuration', () => {
    it('should have assets property', () => {
      expect(config).toHaveProperty('assets');
    });

    it('should have assets as an object', () => {
      expect(typeof config.assets).toBe('object');
      expect(config.assets).not.toBeNull();
    });

    it('should have directory property in assets', () => {
      expect(config.assets).toHaveProperty('directory');
    });

    it('should point to dist/public directory', () => {
      expect(config.assets.directory).toBe('./dist/public');
    });

    it('should have binding property in assets', () => {
      expect(config.assets).toHaveProperty('binding');
    });

    it('should have ASSETS as binding name', () => {
      expect(config.assets.binding).toBe('ASSETS');
    });

    it('should use uppercase for binding name', () => {
      expect(config.assets.binding).toMatch(/^[A-Z_]+$/);
    });
  });

  describe('Build Configuration', () => {
    it('should have build property', () => {
      expect(config).toHaveProperty('build');
    });

    it('should have build as an object', () => {
      expect(typeof config.build).toBe('object');
      expect(config.build).not.toBeNull();
    });

    it('should have command property in build', () => {
      expect(config.build).toHaveProperty('command');
    });

    it('should use pnpm build command', () => {
      expect(config.build.command).toBe('pnpm build');
    });

    it('should match package.json build script', () => {
      const packageJson = JSON.parse(
        readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8')
      );
      expect(packageJson.scripts).toHaveProperty('build');
      expect(config.build.command).toContain('build');
    });
  });

  describe('Required Properties', () => {
    it('should have all required top-level properties', () => {
      const requiredProps = ['name', 'compatibility_date', 'compatibility_flags', 'main', 'assets', 'build'];
      requiredProps.forEach(prop => {
        expect(config).toHaveProperty(prop);
      });
    });

    it('should not have unexpected top-level properties', () => {
      const allowedProps = ['name', 'compatibility_date', 'compatibility_flags', 'main', 'assets', 'build'];
      const configKeys = Object.keys(config);
      configKeys.forEach(key => {
        expect(allowedProps).toContain(key);
      });
    });
  });

  describe('Configuration Consistency', () => {
    it('should have consistent naming across configuration', () => {
      expect(config.name).toBeTruthy();
      expect(config.name.length).toBeGreaterThan(0);
    });

    it('should have all paths using forward slashes', () => {
      expect(config.assets.directory).toMatch(/^\.?\//);
    });

    it('should have relative paths for local references', () => {
      expect(config.main).not.toMatch(/^[/\\]/); // Should not start with absolute path
      expect(config.assets.directory).toMatch(/^\.?\//); // Should start with ./ or /
    });
  });

  describe('Cloudflare Workers Compatibility', () => {
    it('should have a recent compatibility date', () => {
      const date = new Date(config.compatibility_date);
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      expect(date.getTime()).toBeGreaterThan(twoYearsAgo.getTime());
    });

    it('should have nodejs_compat for Node.js compatibility', () => {
      expect(config.compatibility_flags).toContain('nodejs_compat');
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should not have null values', () => {
      Object.values(config).forEach(value => {
        expect(value).not.toBeNull();
      });
    });

    it('should not have undefined values', () => {
      Object.values(config).forEach(value => {
        expect(value).not.toBeUndefined();
      });
    });

    it('should not have empty strings', () => {
      const checkEmpty = (obj: any) => {
        Object.entries(obj).forEach(([key, value]) => {
          if (typeof value === 'string') {
            expect(value.trim()).not.toBe('');
          } else if (typeof value === 'object' && value !== null) {
            checkEmpty(value);
          }
        });
      };
      checkEmpty(config);
    });

    it('should have valid JSON serialization', () => {
      expect(() => JSON.stringify(config)).not.toThrow();
    });
  });

  describe('Deployment Readiness', () => {
    it('should have all required files for deployment', () => {
      const workerPath = resolve(process.cwd(), config.main);
      expect(existsSync(workerPath)).toBe(true);
    });

    it('should reference package manager in build command', () => {
      expect(['npm', 'yarn', 'pnpm', 'bun'].some(pm => 
        config.build.command.includes(pm)
      )).toBe(true);
    });

    it('should have a valid assets binding that matches worker code', () => {
      const workerContent = readFileSync(
        resolve(process.cwd(), config.main), 
        'utf-8'
      );
      expect(workerContent).toContain(config.assets.binding);
    });
  });

  describe('Naming Convention Migration', () => {
    it('should reflect the project purpose in the name', () => {
      // The name should indicate it's a sales goals dashboard
      expect(config.name).toContain('dashboard');
      expect(config.name).toContain('metas');
      expect(config.name).toContain('vendas');
    });

    it('should use Portuguese naming convention', () => {
      // Project uses Portuguese terms
      expect(config.name).toMatch(/metas|vendas/);
    });

    it('should be descriptive enough for identification', () => {
      expect(config.name.length).toBeGreaterThan(5);
    });
  });

  describe('Security and Best Practices', () => {
    it('should not contain sensitive information in name', () => {
      const sensitivePatterns = [
        /api[_-]?key/i,
        /secret/i,
        /password/i,
        /token/i,
        /private/i
      ];
      sensitivePatterns.forEach(pattern => {
        expect(config.name).not.toMatch(pattern);
      });
    });

    it('should use production-ready compatibility date', () => {
      // Should use a stable date, not a future date
      const configDate = new Date(config.compatibility_date);
      const today = new Date();
      expect(configDate.getTime()).toBeLessThanOrEqual(today.getTime());
    });
  });

  describe('Integration with Project Structure', () => {
    it('should align with package.json configuration', () => {
      const packageJson = JSON.parse(
        readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8')
      );
      expect(config.name).toBe(packageJson.name);
    });

    it('should use the same package manager throughout', () => {
      const packageJson = JSON.parse(
        readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8')
      );
      if (packageJson.packageManager) {
        const pm = packageJson.packageManager.split('@')[0];
        expect(config.build.command).toContain(pm);
      }
    });
  });

  describe('Configuration Validation Functions', () => {
    it('should validate that config can be stringified and parsed', () => {
      const stringified = JSON.stringify(config);
      const parsed = JSON.parse(stringified);
      expect(parsed).toEqual(config);
    });

    it('should maintain property order consistency', () => {
      const expectedOrder = ['name', 'compatibility_date', 'compatibility_flags', 'main', 'assets', 'build'];
      const actualKeys = Object.keys(config);
      expectedOrder.forEach((key, index) => {
        expect(actualKeys[index]).toBe(key);
      });
    });
  });

  describe('Regression Tests', () => {
    it('should prevent reverting to old "dashboard" name', () => {
      // This test ensures the name change is intentional and prevents accidental revert
      expect(config.name).not.toBe('dashboard');
      expect(config.name).toBe('dashboard-metas-vendas');
    });

    it('should maintain all other configuration properties unchanged', () => {
      expect(config.compatibility_date).toBe('2025-12-24');
      expect(config.compatibility_flags).toEqual(['nodejs_compat']);
      expect(config.main).toBe('worker.ts');
      expect(config.assets.directory).toBe('./dist/public');
      expect(config.assets.binding).toBe('ASSETS');
      expect(config.build.command).toBe('pnpm build');
    });
  });

  describe('Future-Proofing', () => {
    it('should use a flexible date format that allows updates', () => {
      expect(config.compatibility_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should support array-based compatibility flags for future additions', () => {
      expect(Array.isArray(config.compatibility_flags)).toBe(true);
    });

    it('should have extensible build configuration', () => {
      expect(typeof config.build).toBe('object');
    });
  });
});

describe('Wrangler Configuration Schema Validation', () => {
  let config: any;

  beforeAll(() => {
    const content = readFileSync(resolve(process.cwd(), 'wrangler.jsonc'), 'utf-8');
    const jsonContent = content
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    config = JSON.parse(jsonContent);
  });

  describe('Type Safety', () => {
    it('should have name as string type', () => {
      expect(typeof config.name).toBe('string');
    });

    it('should have compatibility_date as string type', () => {
      expect(typeof config.compatibility_date).toBe('string');
    });

    it('should have compatibility_flags as array type', () => {
      expect(Array.isArray(config.compatibility_flags)).toBe(true);
    });

    it('should have all compatibility_flags as strings', () => {
      config.compatibility_flags.forEach((flag: any) => {
        expect(typeof flag).toBe('string');
      });
    });

    it('should have main as string type', () => {
      expect(typeof config.main).toBe('string');
    });

    it('should have assets as object type', () => {
      expect(typeof config.assets).toBe('object');
      expect(config.assets).not.toBeNull();
      expect(Array.isArray(config.assets)).toBe(false);
    });

    it('should have build as object type', () => {
      expect(typeof config.build).toBe('object');
      expect(config.build).not.toBeNull();
      expect(Array.isArray(config.build)).toBe(false);
    });
  });

  describe('Value Constraints', () => {
    it('should have non-empty name', () => {
      expect(config.name.length).toBeGreaterThan(0);
      expect(config.name.trim()).toBe(config.name);
    });

    it('should have valid compatibility_date range', () => {
      const date = new Date(config.compatibility_date);
      const minDate = new Date('2020-01-01');
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1); // Allow up to 1 year in future
      
      expect(date.getTime()).toBeGreaterThan(minDate.getTime());
      expect(date.getTime()).toBeLessThan(maxDate.getTime());
    });

    it('should have valid file extension for main', () => {
      const validExtensions = ['.ts', '.js', '.mjs'];
      const hasValidExtension = validExtensions.some(ext => config.main.endsWith(ext));
      expect(hasValidExtension).toBe(true);
    });

    it('should have valid directory path for assets', () => {
      expect(config.assets.directory).toMatch(/^\.?[/\\]/);
    });

    it('should have uppercase binding name', () => {
      expect(config.assets.binding).toMatch(/^[A-Z_]+$/);
    });

    it('should have valid build command', () => {
      expect(config.build.command).toMatch(/^(npm|yarn|pnpm|bun)\s+/);
    });
  });
});