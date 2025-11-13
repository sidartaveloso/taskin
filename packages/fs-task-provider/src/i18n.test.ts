import { describe, expect, it } from 'vitest';
import { detectLocale, getI18n, i18nConfig } from './i18n';

describe('i18n', () => {
  describe('i18nConfig', () => {
    it('should have en-US configuration', () => {
      expect(i18nConfig['en-US']).toBeDefined();
      expect(i18nConfig['en-US'].status).toBe('Status');
      expect(i18nConfig['en-US'].type).toBe('Type');
      expect(i18nConfig['en-US'].assignee).toBe('Assignee');
      expect(i18nConfig['en-US'].description).toBe('Description');
    });

    it('should have pt-BR configuration', () => {
      expect(i18nConfig['pt-BR']).toBeDefined();
      expect(i18nConfig['pt-BR'].status).toBe('Status');
      expect(i18nConfig['pt-BR'].type).toBe('Tipo');
      expect(i18nConfig['pt-BR'].assignee).toBe('Responsável');
      expect(i18nConfig['pt-BR'].description).toBe('Descrição');
    });
  });

  describe('getI18n', () => {
    it('should return en-US configuration', () => {
      const config = getI18n('en-US');
      expect(config.status).toBe('Status');
      expect(config.type).toBe('Type');
      expect(config.assignee).toBe('Assignee');
      expect(config.description).toBe('Description');
    });

    it('should return pt-BR configuration', () => {
      const config = getI18n('pt-BR');
      expect(config.status).toBe('Status');
      expect(config.type).toBe('Tipo');
      expect(config.assignee).toBe('Responsável');
      expect(config.description).toBe('Descrição');
    });

    it('should default to en-US when no locale provided', () => {
      const config = getI18n();
      expect(config.status).toBe('Status');
      expect(config.type).toBe('Type');
    });
  });

  describe('detectLocale', () => {
    it('should detect pt-BR from Portuguese content', () => {
      const content = `# Task 001 — Tarefa em Português

## Status
pending

## Tipo
feat

## Responsável
João Silva

## Descrição
Esta é uma descrição em português.`;

      expect(detectLocale(content)).toBe('pt-BR');
    });

    it('should detect en-US from English content', () => {
      const content = `# Task 001 — English Task

## Status
pending

## Type
feat

## Assignee
John Doe

## Description
This is an English description.`;

      expect(detectLocale(content)).toBe('en-US');
    });

    it('should detect pt-BR from Type section', () => {
      const content = `# Task 001

## Tipo
feat`;

      expect(detectLocale(content)).toBe('pt-BR');
    });

    it('should detect pt-BR from Assignee section', () => {
      const content = `# Task 001

## Responsável
Test User`;

      expect(detectLocale(content)).toBe('pt-BR');
    });

    it('should detect pt-BR from Description section', () => {
      const content = `# Task 001

## Descrição
Test description`;

      expect(detectLocale(content)).toBe('pt-BR');
    });

    it('should default to en-US when no specific markers found', () => {
      const content = `# Task 001

## Status
pending`;

      expect(detectLocale(content)).toBe('en-US');
    });

    it('should handle mixed content and prioritize Portuguese markers', () => {
      const content = `# Task 001

## Status
pending

## Type
feat

## Responsável
João Silva`;

      expect(detectLocale(content)).toBe('pt-BR');
    });

    it('should handle empty content', () => {
      expect(detectLocale('')).toBe('en-US');
    });

    it('should handle content without sections', () => {
      const content = 'Just some random text without sections';
      expect(detectLocale(content)).toBe('en-US');
    });
  });
});
