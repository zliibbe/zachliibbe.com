import Footer from '@/app/components/Footer';
import ActivitySection from './ActivitySection';
import styles from './HealthDashboard.module.css';
import RecentActivitiesSection from './RecentActivitiesSection';
import SleepSection from './SleepSection';
import TrainingSection from './TrainingSection';

export default function HealthDashboard() {
  return (
    <>
      <main>
        <div className="universal-gradient-container">
          <div className="universal-gradient-background"></div>
          <div className={styles.container}>
            <div className={styles.contentWrapper}>
              <div className={styles.content}>
                <h1 className={styles.title}>Health</h1>
                <p className={styles.subtitle}>
                  My personal health and training dashboard, synced from Garmin
                  Connect.
                </p>

                <SleepSection />
                <ActivitySection />
                <RecentActivitiesSection />
                <TrainingSection />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
