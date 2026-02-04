import { useState } from 'react';

export default function LayoutDemo() {
  const [showDrawer, setShowDrawer] = useState(false);
  const [adSize, setAdSize] = useState('small'); // 'small' = 160px, 'large' = 300px

  const adWidth = adSize === 'small' ? 160 : 300;
  const drawerWidth = 240;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1a1a2e',
      fontFamily: 'system-ui, sans-serif',
      color: '#fff'
    }}>
      {/* Controls */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: '#16213e',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        borderBottom: '1px solid #0f3460'
      }}>
        <span style={{ fontWeight: 600, color: '#e94560' }}>Layout Demo Controls:</span>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={showDrawer} 
            onChange={(e) => setShowDrawer(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: '#e94560' }}
          />
          <span>Show Drawer (Account/Characters/Tools pages)</span>
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Ad Size:</span>
          <select 
            value={adSize} 
            onChange={(e) => setAdSize(e.target.value)}
            style={{ 
              padding: '6px 12px', 
              backgroundColor: '#0f3460', 
              color: '#fff',
              border: '1px solid #e94560',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            <option value="small">160px (Medium screens)</option>
            <option value="large">300px (Large screens)</option>
          </select>
        </div>
      </div>

      {/* AppBar */}
      <div style={{
        position: 'fixed',
        top: 52,
        left: 0,
        right: 0,
        height: 70,
        backgroundColor: '#16213e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 50,
        borderBottom: '1px solid #0f3460'
      }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: '#e94560' }}>
          Idleon Toolbox
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {['Home', 'Characters', 'Account', 'Tools', 'Data'].map(item => (
            <span key={item} style={{ 
              padding: '8px 16px', 
              backgroundColor: item === 'Characters' && showDrawer ? '#e94560' : 'transparent',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Main Layout Container */}
      <div style={{
        paddingTop: 122, // AppBar height + controls
        paddingBottom: 90, // Bottom ad
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center'
      }}>
        {/* Left Ad Column - Only visible when drawer is NOT shown */}
        {!showDrawer && (
          <div style={{
            width: adWidth,
            flexShrink: 0,
            padding: '16px 8px',
            position: 'sticky',
            top: 122,
            height: 'fit-content',
            alignSelf: 'flex-start'
          }}>
            <div style={{
              backgroundColor: '#e94560',
              borderRadius: 8,
              padding: 16,
              textAlign: 'center',
              minHeight: 600,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>LEFT AD</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{adWidth}px wide</div>
              <div style={{ 
                marginTop: 16, 
                padding: '8px 16px', 
                backgroundColor: 'rgba(0,0,0,0.2)', 
                borderRadius: 4,
                fontSize: 11
              }}>
                Visible on: Homepage, Data pages, etc.
              </div>
            </div>
          </div>
        )}

        {/* Drawer - Only visible on account/characters/tools pages */}
        {showDrawer && (
          <div style={{
            width: drawerWidth,
            flexShrink: 0,
            backgroundColor: '#16213e',
            borderRight: '1px solid #0f3460',
            position: 'sticky',
            top: 122,
            height: 'calc(100vh - 122px - 90px)',
            alignSelf: 'flex-start',
            overflowY: 'auto'
          }}>
            <div style={{ padding: 16 }}>
              <div style={{ 
                fontWeight: 600, 
                marginBottom: 16, 
                color: '#e94560',
                fontSize: 14,
                textTransform: 'uppercase',
                letterSpacing: 1
              }}>
                Drawer Navigation
              </div>
              {['Character 1', 'Character 2', 'Character 3', 'Character 4', 'Character 5'].map((char, i) => (
                <div key={i} style={{
                  padding: '12px 16px',
                  backgroundColor: i === 0 ? '#0f3460' : 'transparent',
                  borderRadius: 6,
                  marginBottom: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#e94560',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    {i + 1}
                  </div>
                  {char}
                </div>
              ))}
              
              <div style={{ 
                marginTop: 24, 
                padding: 16, 
                backgroundColor: '#0f3460', 
                borderRadius: 8,
                fontSize: 12,
                textAlign: 'center',
                color: '#888'
              }}>
                Drawer: {drawerWidth}px<br/>
                (Account, Characters, Tools pages)
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area - Always Centered */}
        <div style={{
          flex: '1 1 auto',
          maxWidth: 1000,
          minWidth: 0,
          padding: '16px 24px'
        }}>
          <div style={{
            backgroundColor: '#16213e',
            borderRadius: 12,
            padding: 32,
            minHeight: 800
          }}>
            <h1 style={{ 
              marginTop: 0, 
              marginBottom: 8,
              color: '#fff',
              fontSize: 28
            }}>
              Centered Content Area
            </h1>
            <p style={{ color: '#888', marginBottom: 24 }}>
              Max-width: 1000px | Always centered between the ad columns
            </p>

            {/* Demo content grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 32
            }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{
                  backgroundColor: '#0f3460',
                  borderRadius: 8,
                  padding: 24,
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    width: 48, 
                    height: 48, 
                    backgroundColor: '#e94560', 
                    borderRadius: 8,
                    margin: '0 auto 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700
                  }}>
                    {i}
                  </div>
                  <div style={{ fontWeight: 500 }}>Card {i}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                    Sample content
                  </div>
                </div>
              ))}
            </div>

            {/* Layout info box */}
            <div style={{
              backgroundColor: '#0f3460',
              borderRadius: 8,
              padding: 24,
              border: '2px dashed #e94560'
            }}>
              <h3 style={{ margin: '0 0 16px', color: '#e94560' }}>Current Layout State:</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 14 }}>
                <div>
                  <strong>Drawer:</strong> {showDrawer ? 'Visible (240px)' : 'Hidden'}
                </div>
                <div>
                  <strong>Left Ad:</strong> {showDrawer ? 'Hidden (drawer takes space)' : `Visible (${adWidth}px)`}
                </div>
                <div>
                  <strong>Right Ad:</strong> Always visible ({adWidth}px)
                </div>
                <div>
                  <strong>Content:</strong> Centered, max 1000px
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Ad Column - Always visible */}
        <div style={{
          width: adWidth,
          flexShrink: 0,
          padding: '16px 8px',
          position: 'sticky',
          top: 122,
          height: 'fit-content',
          alignSelf: 'flex-start'
        }}>
          <div style={{
            backgroundColor: '#e94560',
            borderRadius: 8,
            padding: 16,
            textAlign: 'center',
            minHeight: 600,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>RIGHT AD</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{adWidth}px wide</div>
            <div style={{ 
              marginTop: 16, 
              padding: '8px 16px', 
              backgroundColor: 'rgba(0,0,0,0.2)', 
              borderRadius: 4,
              fontSize: 11
            }}>
              Always visible on all pages
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Ad Banner */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 90,
        backgroundColor: '#e94560',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        gap: 16
      }}>
        <span style={{ fontWeight: 700 }}>BOTTOM AD BANNER</span>
        <span style={{ opacity: 0.8 }}>|</span>
        <span style={{ fontSize: 14, opacity: 0.8 }}>Always visible (90px height)</span>
      </div>
    </div>
  );
}
