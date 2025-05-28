import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import hearingService from '../../services/hearingService';
import { Table, Button, Badge, Modal, Form, Spinner } from 'react-bootstrap';
import HearingScheduleModal from '../../components/HearingScheduleModal';
import HearingStatusUpdater from '../../components/HearingStatusUpdater';

const Hearings = () => {
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState(null);
  const [refreshTime, setRefreshTime] = useState(Date.now());
  const { user } = useAuth();
  const refreshTimer = useRef(null);

  // Helper function to determine if join button should be active
  const isJoinButtonActive = useCallback((hearing, currentTime = new Date()) => {
    if (hearing.status === 'cancelled') return false;
    
    const hearingDate = new Date(hearing.date);
    const hearingEndTime = new Date(hearingDate.getTime() + (hearing.duration * 60000));
    const isActive = currentTime >= hearingDate && currentTime <= hearingEndTime;
    
    console.log('Join button check:', {
      hearingId: hearing._id,
      currentTime: currentTime.toISOString(),
      hearingStart: hearingDate.toISOString(),
      hearingEnd: hearingEndTime.toISOString(),
      isActive
    });
    
    return isActive;
  }, []);

  const fetchHearings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await hearingService.getUpcomingHearings();
      const now = new Date();
      
      // Add a flag to each hearing indicating if join button should be active
      const hearingsWithJoinStatus = response.data.map(hearing => ({
        ...hearing,
        _joinButtonActive: isJoinButtonActive(hearing, now)
      }));
      
      return hearingsWithJoinStatus;
    } catch (error) {
      console.error('Error in fetchHearings:', error);
      throw error;
    }
  }, [isJoinButtonActive]);

  // Set up interval to check for upcoming hearings
  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      if (mounted) {
        try {
          setLoading(true);
          const response = await hearingService.getUpcomingHearings();
          if (mounted) {
            const now = new Date();
            const hearingsWithJoinStatus = response.data.map(hearing => ({
              ...hearing,
              _joinButtonActive: isJoinButtonActive(hearing, now)
            }));
            setHearings(hearingsWithJoinStatus);
          }
        } catch (error) {
          console.error('Error fetching hearings:', error);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      }
    };
    
    fetchData();
    
    // Set up interval to check for active hearings
    const checkActiveHearings = () => {
      if (!mounted) return;
      
      const now = new Date();
      const hasActiveHearing = hearings.some(hearing => {
        const hearingDate = new Date(hearing.date);
        const hearingEndTime = new Date(hearingDate.getTime() + (hearing.duration * 60000));
        return now >= hearingDate && now <= hearingEndTime;
      });
      
      if (hasActiveHearing) {
        console.log('Active hearing detected, refreshing...');
        // Only update if we don't have any active hearings in the current state
        const currentHasActive = hearings.some(h => h._joinButtonActive);
        if (!currentHasActive) {
          setRefreshTime(Date.now());
        }
      }
    };
    
    // Check every 30 seconds for active hearings
    const intervalId = setInterval(checkActiveHearings, 30000);
    
    // Cleanup function
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [refreshTime, isJoinButtonActive]); // Only depend on refreshTime and isJoinButtonActive

  const handleOpenScheduleModal = (hearing) => {
    setSelectedHearing(hearing);
    setShowScheduleModal(true);
  };

  const handleCloseScheduleModal = () => {
    setSelectedHearing(null);
    setShowScheduleModal(false);
  };

  const handleHearingUpdated = () => {
    fetchHearings();
    setRefreshTime(Date.now()); // Force re-render to update button states
  };

  const handleScheduleHearing = async (hearingData) => {
    try {
      await hearingService.createHearing(hearingData);
      fetchHearings();
      handleCloseScheduleModal();
    } catch (error) {
      console.error('Error scheduling hearing:', error);
    }
  };

  const getStatusBadge = (status, hearing) => {
    if (!hearing) return <Badge bg="secondary">Unknown</Badge>;
    
    const statusConfig = {
      'scheduled': {
        text: 'Scheduled',
        variant: 'primary',
        icon: 'bi-calendar-check'
      },
      'in-progress': {
        text: 'In Progress',
        variant: 'info',
        showLiveDot: true,
        icon: 'bi-arrow-repeat'
      },
      'waiting-decision': {
        text: 'Waiting for Decision',
        variant: 'warning',
        icon: 'bi-hourglass-split'
      },
      'completed': {
        text: 'Completed',
        variant: 'success',
        icon: 'bi-check-circle-fill',
        className: 'fw-bold',
        iconClass: 'me-1',
        animation: 'pulse'
      },
      'adjourned': {
        text: 'Adjourned',
        variant: 'secondary',
        icon: 'bi-calendar-x'
      },
      'cancelled': {
        text: 'Cancelled',
        variant: 'danger',
        icon: 'bi-x-circle-fill'
      }
    };
    
    const config = statusConfig[status] || { text: status, variant: 'secondary', icon: 'bi-question-circle' };
    const badgeClass = `d-flex align-items-center ${config.className || ''}`;
    const iconClass = `${config.icon} ${config.iconClass || ''} ${config.animation ? `animate__animated animate__${config.animation}` : ''}`;
    
    return (
      <div className="d-flex align-items-center">
        <Badge bg={config.variant} className={badgeClass}>
          <i className={`bi ${iconClass}`}></i>
          <span>{config.text}</span>
        </Badge>
        {config.showLiveDot && (
          <span className="position-relative ms-1">
            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
              <span className="visually-hidden">Live</span>
            </span>
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading hearings...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Hearings Management</h2>
        {/* <Button variant="primary" onClick={() => handleOpenScheduleModal(null)}>
          Schedule New Hearing
        </Button> */}
      </div>

      <div className="card">
        <div className="card-body">
          <Table striped hover responsive>
            <thead>
              <tr>
                <th>Case Title</th>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Status</th>
                <th>Location</th>
                {user.role === 'court-officer' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {hearings.map((hearing) => (
                <tr key={hearing._id}>
                  <td>{hearing.case?.title}</td>
                  <td>
                    {new Date(hearing.date).toLocaleString()}
                  </td>
                  <td>
                    {hearing.type === 'virtual' ? (
                      <Badge bg="primary">Virtual</Badge>
                    ) : (
                      <Badge bg="success">Physical</Badge>
                    )}
                  </td>
                  <td className="d-flex align-items-center">
                    {getStatusBadge(hearing.status, hearing)}
                    {user.role === 'court-officer' && (
                      <HearingStatusUpdater 
                        hearing={hearing} 
                        onStatusUpdated={fetchHearings} 
                      />
                    )}
                  </td>
                  <td>
                    {hearing.type === 'physical' ? (
                      <div className="d-flex align-items-center">
                        <i className="bi bi-geo-alt-fill me-2"></i>
                        <span>{hearing.location?.address || 'Location not specified'}</span>
                      </div>
                    ) : (
                      <div className="d-flex flex-column">
                        {hearing.location?.virtualLink ? (
                          <>
                            <Button
                              href={(() => {
                                const hearingDate = new Date(hearing.date);
                                const hearingEndTime = new Date(hearingDate.getTime() + (hearing.duration * 60000));
                                return new Date() >= hearingDate && new Date() <= hearingEndTime
                                  ? hearing.location.virtualLink 
                                  : '#';
                              })()}
                              target="_blank"
                              variant="primary"
                              className="mb-1"
                              disabled={!hearing._joinButtonActive || hearing.status === 'cancelled'}
                              style={{
                                opacity: (hearing._joinButtonActive && hearing.status !== 'cancelled') ? 1 : 0.7,
                                cursor: (() => {
                                  if (hearing.status === 'cancelled') return 'not-allowed';
                                  return hearing._joinButtonActive ? 'pointer' : 'not-allowed';
                                })()
                              }}
                            >
                              <i className="bi bi-camera-video me-2"></i>
                              {(() => {
                                const hearingDate = new Date(hearing.date);
                                const hearingEndTime = new Date(hearingDate.getTime() + (hearing.duration * 60000));
                                const now = new Date();
                                
                                if (now < hearingDate) {
                                  return `Meeting starts at ${hearingDate.toLocaleTimeString()}`;
                                } else if (now > hearingEndTime) {
                                  return 'Meeting has ended';
                                } 
                                else if(hearing.status == 'cancelled') {
                                  return 'Meeting Cancelled';
                                }
                                else {
                                  return 'Join Meeting';
                                }
                              })()}
                            </Button>
                            {new Date(hearing.date) > new Date() && (
                              <small className="text-muted d-block">
                                <i className="bi bi-clock me-1"></i>
                                Available at {new Date(hearing.date).toLocaleString()}
                              </small>
                            )}
                          </>
                        ) : (
                          <div className="text-muted">
                            <i className="bi bi-link-45deg me-1"></i>
                            <span>No meeting link provided</span>
                            {user.role === 'court-officer' && (
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="ms-2 p-0"
                                onClick={() => handleOpenScheduleModal(hearing)}
                              >
                                <i className="bi bi-pencil-square"></i> Add Link
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    {user.role === 'court-officer' && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={hearing.status === 'completed' || hearing.status === 'in-progress' || hearing.status === 'cancelled'}
                        onClick={() => handleOpenScheduleModal(hearing)}
                      >
                        Edit
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      <HearingScheduleModal
        show={showScheduleModal}
        onClose={handleCloseScheduleModal}
        caseId={selectedHearing?.case?._id}
        hearing={selectedHearing}
        onHearingUpdated={handleHearingUpdated}
      />
    </div>
  );
};

export default Hearings;
