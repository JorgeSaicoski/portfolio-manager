# Operations Documentation

Daily operations, maintenance, and troubleshooting guides for Portfolio Manager.

## 📚 Available Guides

### 📊 [Audit Logging](audit-logging.md)
Complete audit logging system reference and usage guide.

**Topics:**
- Audit log structure and purpose
- Log file types (create, update, delete, error)
- Querying and analyzing logs
- **Emergency database recovery from audit logs**
- Implementation patterns
- Best practices and troubleshooting

**Time to read**: 30 minutes

### 💾 [Backup & Restore](backup-restore.md)
Database backup and restore procedures.

**Covers:**
- Manual and automated backups
- Restore procedures
- Disaster recovery
- Audit logs as backup alternative
- Backup retention and best practices

**Time to read**: 45 minutes

## 🚀 Quick Links

### New Operators
1. Understand [Audit Logging](audit-logging.md) - Know what's being tracked
2. Set up [Automated Backups](backup-restore.md#automated-backups)
3. Review [How to Monitor](../how-to-do/how-to-monitor.md)

### Daily Operations
- [How to Audit](../how-to-do/how-to-audit.md) - Review logs for issues
- [How to Monitor](../how-to-do/how-to-monitor.md) - Check system health
- [How to Investigate](../how-to-do/how-to-investigate.md) - Debug problems

### Emergency Procedures
- [Emergency Database Recovery](audit-logging.md#emergency-database-recovery) - Rebuild from audit logs
- [Restore from Backup](backup-restore.md#restore-from-backup) - Standard recovery
- [How to Rollback](../how-to-do/how-to-rollback.md) - Deployment rollback

## 📖 Related Documentation

- [Security Documentation](../security/) - Security audits and compliance
- [How-To Guides](../how-to-do/) - Step-by-step operational tasks
- [Deployment](../deployment/) - Production deployment and CI/CD

---

[⬅️ Back to Documentation](../README.md)
