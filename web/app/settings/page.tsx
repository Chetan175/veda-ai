'use client';

import { useState } from 'react';
import { DashboardShell } from '@/components/DashboardShell';
import { Bell, Lock, Palette, LogOut, Save, Check } from 'lucide-react';

interface UserSettings {
  schoolName: string;
  schoolEmail: string;
  teacherName: string;
  defaultLanguage: string;
  defaultTimeZone: string;
  emailNotifications: boolean;
  pdfHeaderBranding: string;
  pdfFooterBranding: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    schoolName: 'Delhi Public School',
    schoolEmail: 'admin@dps.edu.in',
    teacherName: 'Ramesh Kumar',
    defaultLanguage: 'en',
    defaultTimeZone: 'IST',
    emailNotifications: true,
    pdfHeaderBranding: 'DPS - Quality Education',
    pdfFooterBranding: 'Powered by VedaAI Assessment Creator'
  });

  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'branding'>('account');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleSettingsChange = (key: keyof UserSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaveStatus('idle');
  };

  const handleSaveSettings = async () => {
    setSaveStatus('saving');
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setSaveStatus('saving');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaveStatus('saved');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  return (
    <DashboardShell breadcrumb="Settings" backHref="/assignments" showFloatingAdd={false}>
      <div className="settings-container">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your account, preferences, and school branding</p>
        </div>

        <div className="settings-layout">
          <div className="settings-tabs">
            <button
              className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              <Lock size={18} />
              <span>Account</span>
            </button>
            <button
              className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={18} />
              <span>Notifications</span>
            </button>
            <button
              className={`settings-tab ${activeTab === 'branding' ? 'active' : ''}`}
              onClick={() => setActiveTab('branding')}
            >
              <Palette size={18} />
              <span>Branding</span>
            </button>
          </div>

          <div className="settings-content">
            {activeTab === 'account' && (
              <div className="settings-section">
                <h2>Account Settings</h2>
                <p className="section-description">Manage your account information and security</p>

                <div className="settings-form">
                  <div className="form-group">
                    <label htmlFor="teacherName">Your Name</label>
                    <input
                      id="teacherName"
                      type="text"
                      value={settings.teacherName}
                      onChange={(e) => handleSettingsChange('teacherName', e.target.value)}
                      placeholder="Teacher name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="schoolName">School Name</label>
                    <input
                      id="schoolName"
                      type="text"
                      value={settings.schoolName}
                      onChange={(e) => handleSettingsChange('schoolName', e.target.value)}
                      placeholder="School name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="schoolEmail">School Email</label>
                    <input
                      id="schoolEmail"
                      type="email"
                      value={settings.schoolEmail}
                      onChange={(e) => handleSettingsChange('schoolEmail', e.target.value)}
                      placeholder="School email"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="language">Language</label>
                      <select
                        id="language"
                        value={settings.defaultLanguage}
                        onChange={(e) => handleSettingsChange('defaultLanguage', e.target.value)}
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="timezone">Time Zone</label>
                      <select
                        id="timezone"
                        value={settings.defaultTimeZone}
                        onChange={(e) => handleSettingsChange('defaultTimeZone', e.target.value)}
                      >
                        <option value="IST">IST (India)</option>
                        <option value="UTC">UTC</option>
                        <option value="PST">PST (US Pacific)</option>
                        <option value="EST">EST (US Eastern)</option>
                      </select>
                    </div>
                  </div>

                  <div className="divider" />

                  <h3>Change Password</h3>
                  <form onSubmit={handlePasswordChange}>
                    <div className="form-group">
                      <label htmlFor="currentPassword">Current Password</label>
                      <input
                        id="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="newPassword">New Password</label>
                      <input
                        id="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder="Enter new password"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm Password</label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                    <button type="submit" className="secondary-pill light">
                      <Lock size={14} />
                      Update Password
                    </button>
                  </form>

                  <div className="divider" />

                  <h3>Danger Zone</h3>
                  <button className="danger-button">
                    <LogOut size={14} />
                    Logout All Sessions
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="settings-section">
                <h2>Notification Preferences</h2>
                <p className="section-description">Manage how you receive updates about your assessments</p>

                <div className="notification-settings">
                  <div className="notification-item">
                    <div className="notification-info">
                      <h4>Assessment Generation Complete</h4>
                      <p>Get notified when your assessment is ready to download</p>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleSettingsChange('emailNotifications', e.target.checked)}
                      />
                      <span></span>
                    </label>
                  </div>

                  <div className="notification-item">
                    <div className="notification-info">
                      <h4>Assignment Updates</h4>
                      <p>Get notified about changes to your assignments</p>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" defaultChecked={true} />
                      <span></span>
                    </label>
                  </div>

                  <div className="notification-item">
                    <div className="notification-info">
                      <h4>System Updates</h4>
                      <p>Get notified about new features and improvements</p>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" defaultChecked={true} />
                      <span></span>
                    </label>
                  </div>

                  <div className="notification-item">
                    <div className="notification-info">
                      <h4>Weekly Summary</h4>
                      <p>Receive a weekly summary of your assessment activity</p>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" defaultChecked={false} />
                      <span></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'branding' && (
              <div className="settings-section">
                <h2>School Branding</h2>
                <p className="section-description">Customize how your school appears on generated assessments</p>

                <div className="settings-form">
                  <div className="form-group">
                    <label htmlFor="headerBranding">PDF Header Text</label>
                    <input
                      id="headerBranding"
                      type="text"
                      value={settings.pdfHeaderBranding}
                      onChange={(e) => handleSettingsChange('pdfHeaderBranding', e.target.value)}
                      placeholder="Header text for PDF documents"
                    />
                    <small>This will appear at the top of all generated question papers</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="footerBranding">PDF Footer Text</label>
                    <input
                      id="footerBranding"
                      type="text"
                      value={settings.pdfFooterBranding}
                      onChange={(e) => handleSettingsChange('pdfFooterBranding', e.target.value)}
                      placeholder="Footer text for PDF documents"
                    />
                    <small>This will appear at the bottom of all generated question papers</small>
                  </div>

                  <div className="preview-box">
                    <h4>PDF Preview</h4>
                    <div className="preview-content">
                      <div className="preview-header">{settings.pdfHeaderBranding}</div>
                      <div className="preview-body">
                        <h2>Question Paper</h2>
                        <p>Subject: Mathematics</p>
                        <p>Time: 3 hours | Marks: 100</p>
                      </div>
                      <div className="preview-footer">{settings.pdfFooterBranding}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="settings-actions">
              <button
                className="primary-pill dark"
                onClick={handleSaveSettings}
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saving' && <span className="spinner"></span>}
                {saveStatus === 'saved' && <Check size={16} />}
                {saveStatus === 'idle' && <Save size={16} />}
                <span>
                  {saveStatus === 'idle' ? 'Save Changes' : saveStatus === 'saving' ? 'Saving...' : 'Saved!'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .settings-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .settings-header h1 {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .settings-header p {
          color: var(--muted);
          font-size: 14px;
          margin: 0;
        }

        .settings-layout {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 24px;
        }

        .settings-tabs {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .settings-tab {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          background: var(--panel-2);
          border: 1px solid transparent;
          color: var(--muted);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .settings-tab:hover {
          background: var(--panel-3);
          color: var(--ink);
        }

        .settings-tab.active {
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          color: white;
          border-color: var(--accent);
        }

        .settings-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
          background: var(--panel-2);
          border-radius: var(--radius-lg);
          padding: 32px;
          box-shadow: var(--shadow-sm);
        }

        .settings-section h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .section-description {
          color: var(--muted);
          font-size: 14px;
          margin: 0 0 24px 0;
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-weight: 600;
          font-size: 14px;
          color: var(--ink);
        }

        .form-group input,
        .form-group select {
          padding: 10px 14px;
          border: 1px solid var(--panel-3);
          border-radius: var(--radius-md);
          font-size: 14px;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 2px rgba(255, 106, 61, 0.1);
        }

        .form-group small {
          color: var(--muted);
          font-size: 12px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .divider {
          height: 1px;
          background: var(--panel-3);
          margin: 24px 0;
        }

        .settings-section h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 16px 0;
        }

        .danger-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(255, 77, 77, 0.1);
          color: var(--danger);
          border: 1px solid var(--danger);
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .danger-button:hover {
          background: var(--danger);
          color: white;
        }

        .notification-settings {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .notification-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: var(--panel-3);
          border-radius: var(--radius-md);
        }

        .notification-info h4 {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .notification-info p {
          font-size: 13px;
          color: var(--muted);
          margin: 0;
        }

        .toggle {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 28px;
          cursor: pointer;
        }

        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle span {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--panel-3);
          transition: 0.3s;
          border-radius: 28px;
        }

        .toggle span:before {
          position: absolute;
          content: '';
          height: 22px;
          width: 22px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        .toggle input:checked + span {
          background-color: var(--accent);
        }

        .toggle input:checked + span:before {
          transform: translateX(22px);
        }

        .preview-box {
          margin-top: 24px;
          padding: 24px;
          background: var(--panel-3);
          border-radius: var(--radius-md);
          border: 1px dashed var(--panel);
        }

        .preview-box h4 {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 16px 0;
        }

        .preview-content {
          background: white;
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .preview-header,
        .preview-footer {
          background: linear-gradient(135deg, var(--canvas), var(--canvas-soft));
          color: white;
          padding: 12px 16px;
          font-size: 12px;
          font-weight: 600;
        }

        .preview-body {
          padding: 20px;
          color: var(--ink);
        }

        .preview-body h2 {
          font-size: 18px;
          margin: 0 0 12px 0;
        }

        .preview-body p {
          font-size: 13px;
          margin: 4px 0;
          color: var(--muted);
        }

        .settings-actions {
          display: flex;
          gap: 12px;
          padding-top: 24px;
          border-top: 1px solid var(--panel-3);
        }

        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .settings-layout {
            grid-template-columns: 1fr;
          }

          .settings-tabs {
            flex-direction: row;
            overflow-x: auto;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .settings-content {
            padding: 24px;
          }
        }
      `}</style>
    </DashboardShell>
  );
}
