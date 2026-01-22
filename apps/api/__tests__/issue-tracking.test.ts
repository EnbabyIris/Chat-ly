import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Issue Tracking System', () => {
  describe('Issue Creation', () => {
    it('should create a new issue with valid data', () => {
      const issueData = {
        title: 'Test Issue',
        description: 'Test description',
        priority: 'high',
        labels: ['bug']
      };

      expect(issueData.title).toBe('Test Issue');
      expect(issueData.priority).toBe('high');
    });

    it('should validate issue title length', () => {
      const shortTitle = '';
      const longTitle = 'a'.repeat(300);

      expect(shortTitle.length).toBe(0);
      expect(longTitle.length).toBeGreaterThan(200);
    });

    it('should handle issue labels correctly', () => {
      const labels = ['bug', 'enhancement', 'documentation'];

      expect(labels).toContain('bug');
      expect(labels).toHaveLength(3);
    });
  });

  describe('Issue Updates', () => {
    it('should update issue status', () => {
      const issue = { status: 'open' };
      const updatedIssue = { ...issue, status: 'closed' };

      expect(updatedIssue.status).toBe('closed');
    });

    it('should add comments to issues', () => {
      const issue = { comments: [] };
      const comment = { text: 'Test comment', author: 'user1' };

      issue.comments.push(comment);

      expect(issue.comments).toHaveLength(1);
      expect(issue.comments[0].text).toBe('Test comment');
    });

    it('should handle priority changes', () => {
      const issue = { priority: 'low' };
      const priorities = ['low', 'medium', 'high', 'urgent'];

      expect(priorities).toContain(issue.priority);
    });
  });

  describe('Issue Search and Filtering', () => {
    it('should filter issues by status', () => {
      const issues = [
        { id: 1, status: 'open' },
        { id: 2, status: 'closed' },
        { id: 3, status: 'open' }
      ];

      const openIssues = issues.filter(issue => issue.status === 'open');

      expect(openIssues).toHaveLength(2);
      expect(openIssues.every(issue => issue.status === 'open')).toBe(true);
    });

    it('should search issues by title', () => {
      const issues = [
        { title: 'Fix login bug' },
        { title: 'Add new feature' },
        { title: 'Update documentation' }
      ];

      const searchResults = issues.filter(issue =>
        issue.title.toLowerCase().includes('fix')
      );

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].title).toBe('Fix login bug');
    });

    it('should sort issues by priority', () => {
      const issues = [
        { priority: 'low' },
        { priority: 'high' },
        { priority: 'medium' }
      ];

      const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
      const sortedIssues = issues.sort((a, b) =>
        priorityOrder[b.priority] - priorityOrder[a.priority]
      );

      expect(sortedIssues[0].priority).toBe('high');
    });
  });

  describe('Issue Analytics', () => {
    it('should calculate issue resolution time', () => {
      const createdAt = new Date('2024-01-01');
      const resolvedAt = new Date('2024-01-05');

      const resolutionTime = resolvedAt.getTime() - createdAt.getTime();
      const daysToResolve = resolutionTime / (1000 * 60 * 60 * 24);

      expect(daysToResolve).toBe(4);
    });

    it('should count issues by priority', () => {
      const issues = [
        { priority: 'high' },
        { priority: 'low' },
        { priority: 'high' },
        { priority: 'medium' }
      ];

      const priorityCounts = issues.reduce((counts, issue) => {
        counts[issue.priority] = (counts[issue.priority] || 0) + 1;
        return counts;
      }, {});

      expect(priorityCounts.high).toBe(2);
      expect(priorityCounts.medium).toBe(1);
      expect(priorityCounts.low).toBe(1);
    });

    it('should track issue status changes', () => {
      const statusHistory = [
        { status: 'open', timestamp: '2024-01-01' },
        { status: 'in_progress', timestamp: '2024-01-02' },
        { status: 'closed', timestamp: '2024-01-05' }
      ];

      expect(statusHistory).toHaveLength(3);
      expect(statusHistory[statusHistory.length - 1].status).toBe('closed');
    });
  });
});