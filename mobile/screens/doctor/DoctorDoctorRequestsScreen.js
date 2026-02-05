import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, ActivityIndicator, TextInput, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelectedWorkplace } from '../../contexts/SelectedWorkplaceContext';
import { useFocusEffect } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { doctorService } from '../../services/doctor/doctorService';

const { width, height } = Dimensions.get('window');

const RESUBMISSION_PILLS = [
  'Document is unclear / blurred',
  'Wrong document uploaded',
  'Mismatch in registration details',
  'Signature / stamp missing',
  'Incomplete pages / missing information',
  'Expired document (upload a valid one)',
];

const REJECT_PILLS = [
  'Doctor is not eligible for this workplace role',
  'Registration details appear invalid',
  'Repeated incorrect submissions',
  'Document appears tampered / suspicious',
  'Requested role is not applicable for this workplace',
];

const toTitleCaseWords = (value) => {
  const s = String(value || '').trim();
  if (!s) return '';
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const word = String(w);
      const head = word.charAt(0).toUpperCase();
      const tail = word.slice(1).toLowerCase();
      return `${head}${tail}`;
    })
    .join(' ');
};

const toKey = (value) => String(value || '').trim().toLowerCase();

const toHumanLabel = (value) => {
  const v = String(value || '').trim();
  if (!v) return '';
  return toTitleCaseWords(v.replace(/_/g, ' '));
};

const formatDateTime = (value) => {
  const iso = String(value || '').trim();
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mon = d.toLocaleString('en-US', { month: 'short' });
  const yyyy = String(d.getFullYear());
  const time = d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${dd} ${mon} ${yyyy} • ${time}`;
};

const attemptTone = (attempts) => {
  const n = Number(attempts);
  if (!Number.isFinite(n)) return { bg: 'rgba(241,245,249,0.92)', border: '#e2e8f0', text: '#64748b' };
  if (n >= 3) return { bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.18)', text: '#b91c1c' };
  if (n === 2) return { bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.22)', text: '#b45309' };
  return { bg: 'rgba(241,245,249,0.92)', border: '#e2e8f0', text: '#64748b' };
};

const DoctorDoctorRequestsScreen = ({ navigation }) => {
  const { selectedWorkplace: activeWorkplace } = useSelectedWorkplace();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [openingKey, setOpeningKey] = useState(null);
  const [docsModal, setDocsModal] = useState({ visible: false, title: '', docs: [], kind: null });
  const [viewer, setViewer] = useState({
    visible: false,
    title: '',
    dataUrl: '',
    mime: '',
    base64: '',
    status: 'idle',
    error: '',
    doc: null,
    docKind: null,
  });
  const [viewerMetaExpanded, setViewerMetaExpanded] = useState(false);
  const [viewerMetaHeight, setViewerMetaHeight] = useState(0);
  const [viewerWebLoading, setViewerWebLoading] = useState(false);
  const [filterKey, setFilterKey] = useState('pending');
  const [expanded, setExpanded] = useState({});

  const [overlay, setOverlay] = useState({ visible: false, variant: 'info', title: '', message: '' });

  const [actionModal, setActionModal] = useState({
    visible: false,
    stage: 'edit',
    action: null,
    request: null,
    selectedPills: [],
    notes: '',
    error: '',
    submitting: false,
  });

  const workplaceLabel = useMemo(() => {
    if (!activeWorkplace) return '';
    return toTitleCaseWords(activeWorkplace.place_name || 'Workplace');
  }, [activeWorkplace]);

  const placeId = activeWorkplace?.place_id;
  const roleKey = String(activeWorkplace?.role || '').toLowerCase();
  const roleStatusKey = String(activeWorkplace?.role_status || '').toLowerCase();
  const isOwner = roleKey === 'owner' && (!roleStatusKey || roleStatusKey === 'approved');

  const normalizeBase64 = (value) =>
    String(value || '')
      .trim()
      .replace(/^base64,/, '')
      .replace(/\s+/g, '')
      .replace(/,+$/, '');

  const guessMimeFromBase64 = (base64) => {
    const b = normalizeBase64(base64);
    if (!b) return null;
    if (b.startsWith('JVBERi0')) return 'application/pdf';
    if (b.startsWith('/9j/')) return 'image/jpeg';
    if (b.startsWith('iVBORw0KGgo')) return 'image/png';
    if (b.startsWith('UklGR')) return 'image/webp';
    return null;
  };

  const docIdOf = (doc) =>
    doc?.id ??
    doc?.doc_id ??
    doc?.document_id ??
    doc?.role_document_id ??
    doc?.verification_document_id ??
    doc?.file_id ??
    null;

  const actionTitleLabel = (action) => {
    const a = toKey(action);
    if (a === 'approve') return 'Approve request';
    if (a === 'reject') return 'Reject request';
    if (a === 'resubmission') return 'Request re-upload';
    return toTitleCaseWords(action || '') || 'Action';
  };

  const reviewPillsForAction = (action) => {
    const a = toKey(action);
    if (a === 'reject') return REJECT_PILLS;
    if (a === 'resubmission') return RESUBMISSION_PILLS;
    return RESUBMISSION_PILLS;
  };

  const reviewCardCopy = (action) => {
    const a = toKey(action);
    if (a === 'reject') {
      return {
        title: 'Rejection reason (required)',
        subtitle: 'Visible to the doctor. Keep it short and specific.',
      };
    }
    if (a === 'resubmission') {
      return {
        title: 'Review notes (required)',
        subtitle: 'Visible to the doctor. Mention what to correct and re-upload.',
      };
    }
    return {
      title: 'Review notes (required)',
      subtitle: 'This note is visible to the doctor and explains what to fix.',
    };
  };

  const actionWarningCopy = (action) => {
    const a = toKey(action);
    if (a === 'approve') {
      return {
        title: 'Verify documents before approving',
        body: 'Approval grants access to this workplace. Please confirm all documents are valid and match the doctor’s details before you approve.',
      };
    }
    if (a === 'reject') {
      return {
        title: 'Verify carefully before rejecting',
        body: 'Reject is permanent. The doctor will be blocked from joining this workplace.',
      };
    }
    if (a === 'resubmission') {
      return {
        title: 'Resubmission = reject current documents only',
        body: 'This requests a new upload for the same application. Max 3 submissions total. After that, the request will be automatically rejected for this workplace.',
      };
    }
    return null;
  };

  const normalizeDataUrl = (input) => {
    const rawFull = String(input || '').trim();
    if (!rawFull) return null;
    const firstDataIdx = rawFull.toLowerCase().indexOf('data:');
    let raw = rawFull;
    if (firstDataIdx !== -1) {
      const secondDataIdx = rawFull.toLowerCase().indexOf('data:', firstDataIdx + 5);
      if (secondDataIdx !== -1) {
        raw = rawFull.slice(firstDataIdx, secondDataIdx).replace(/,+$/, '');
      }
    }
    const match = raw.match(/^data:([^;]+);base64,([\s\S]*)$/);
    if (match) {
      const mime = String(match[1] || '').trim();
      const base64 = normalizeBase64(match[2]);
      if (!mime || !base64) return null;
      const guessed = mime === 'application/octet-stream' || mime === 'binary/octet-stream' ? guessMimeFromBase64(base64) : null;
      const effectiveMime = guessed || mime;
      return { mime: effectiveMime, base64, dataUrl: `data:${effectiveMime};base64,${base64}` };
    }
    const base64 = normalizeBase64(raw);
    if (!base64) return null;
    const mime = guessMimeFromBase64(base64);
    if (!mime) return null;
    return { mime, base64, dataUrl: `data:${mime};base64,${base64}` };
  };

  const parseDataUrl = (dataUrl) => {
    const normalized = normalizeDataUrl(dataUrl);
    if (!normalized) return null;
    return { mime: normalized.mime, base64: normalized.base64, dataUrl: normalized.dataUrl };
  };

  const extFromMime = (mime) => {
    const m = String(mime || '').toLowerCase();
    if (m.includes('pdf')) return 'pdf';
    if (m.includes('png')) return 'png';
    if (m.includes('jpeg') || m.includes('jpg')) return 'jpg';
    if (m.includes('webp')) return 'webp';
    return 'bin';
  };

  const buildPdfHtml = (base64) => {
    const b64 = String(base64 || '');
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { margin: 0; padding: 0; background: #0b1220; color: #e2e8f0; font-family: -apple-system, system-ui, Segoe UI, Roboto, Arial; }
      #status { display: none; }
      #pages { padding: 8px 10px 24px; }
      canvas { width: 100%; height: auto; display: block; background: #fff; border-radius: 10px; margin: 10px 0; }
      .err { color: #fecaca; font-weight: 800; }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  </head>
  <body>
    <div id="status"></div>
    <div id="pages"></div>

    <script>
      (function () {
        try {
          const base64 = ${JSON.stringify(b64)};
          if (!base64) {
            document.getElementById('status').innerHTML = '<span class="err">PDF content is missing.</span>';
            return;
          }
          const raw = atob(base64);
          const bytes = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

          const loadingTask = pdfjsLib.getDocument({ data: bytes });
          loadingTask.promise.then(async function (pdf) {
            const pages = document.getElementById('pages');
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              const page = await pdf.getPage(pageNum);
              const viewport = page.getViewport({ scale: 1.6 });
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              pages.appendChild(canvas);
              await page.render({ canvasContext: context, viewport: viewport }).promise;
            }
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage('rendered');
            }
          }).catch(function (err) {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage('error:Unable to render PDF.');
            }
          });
        } catch (e) {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage('error:Unable to render PDF.');
          }
        }
      })();
    </script>
  </body>
</html>`;
  };

  const buildImageHtml = (uri) => {
    const src = String(uri || '').trim();
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { margin: 0; padding: 0; background: #0b1220; }
      .wrap { height: 100vh; width: 100vw; display: flex; align-items: center; justify-content: center; }
      img { max-width: 100vw; max-height: 100vh; object-fit: contain; }
      .err { color: #fecaca; font-family: -apple-system, system-ui, Segoe UI, Roboto, Arial; font-weight: 800; padding: 16px; text-align: center; }
    </style>
  </head>
  <body>
    <div class="wrap">
      ${src ? `<img id="img" src="${src}" />` : '<div class="err">Image is missing.</div>'}
    </div>
    <script>
      (function () {
        try {
          var img = document.getElementById('img');
          if (!img) {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage('error:Image is missing.');
            }
            return;
          }
          img.onload = function () {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage('rendered');
            }
          };
          img.onerror = function () {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage('error:Unable to render image.');
            }
          };
        } catch (e) {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage('error:Unable to render image.');
          }
        }
      })();
    </script>
  </body>
</html>`;
  };

  const openDocumentDataUrl = async ({ dataUrl, title, doc, docKind }) => {
    setViewerMetaExpanded(false);
    setViewerMetaHeight(0);
    if (!dataUrl) {
      setViewer({
        visible: true,
        title: title || 'Document',
        dataUrl: '',
        mime: '',
        base64: '',
        status: 'missing',
        error: '',
        doc: doc || null,
        docKind: docKind || null,
      });
      return;
    }

    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
      setViewer({
        visible: true,
        title: title || 'Document',
        dataUrl: '',
        mime: '',
        base64: '',
        status: 'error',
        error: 'Document is corrupted or unsupported.',
        doc: doc || null,
        docKind: docKind || null,
      });
      return;
    }

    if (parsed.mime.startsWith('image/')) {
      setViewerWebLoading(true);
      const baseTitle = String(title || 'document').slice(0, 40);
      const safeBase = baseTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
      const ext = extFromMime(parsed.mime);
      const fileUri = `${FileSystem.cacheDirectory}${safeBase}_${Date.now()}.${ext}`;
      try {
        await FileSystem.writeAsStringAsync(fileUri, String(parsed.base64), { encoding: FileSystem.EncodingType.Base64 });
        setViewer({
          visible: true,
          title: title || 'Document',
          dataUrl: fileUri,
          mime: parsed.mime,
          base64: parsed.base64,
          status: 'idle',
          error: '',
          doc: doc || null,
          docKind: docKind || null,
        });
      } catch (e) {
        setViewer({
          visible: true,
          title: title || 'Document',
          dataUrl: parsed.dataUrl,
          mime: parsed.mime,
          base64: parsed.base64,
          status: 'idle',
          error: '',
          doc: doc || null,
          docKind: docKind || null,
        });
      }
      return;
    }

    if (String(parsed.mime || '').toLowerCase().includes('pdf')) {
      setViewerWebLoading(true);
      setViewer({
        visible: true,
        title: title || 'Document',
        dataUrl: '',
        mime: parsed.mime,
        base64: parsed.base64,
        status: 'pdf',
        error: '',
        doc: doc || null,
        docKind: docKind || null,
      });
      return;
    }

    setViewer({
      visible: true,
      title: title || 'Document',
      dataUrl: '',
      mime: parsed.mime,
      base64: '',
      status: 'error',
      error: 'Unsupported document type. Please upload JPG, PNG, or PDF.',
      doc: doc || null,
      docKind: docKind || null,
    });
  };

  const closeViewer = () => {
    setViewerMetaExpanded(false);
    setViewerMetaHeight(0);
    setViewerWebLoading(false);
    setViewer({ visible: false, title: '', dataUrl: '', mime: '', base64: '', status: 'idle', error: '', doc: null, docKind: null });
  };

  const openAction = (action, request) => {
    const actionKey = toKey(action);
    setActionModal({
      visible: true,
      stage: actionKey === 'approve' ? 'confirm' : 'edit',
      action,
      request,
      selectedPills: [],
      notes: '',
      error: '',
      submitting: false,
    });
  };

  const toggleReviewPill = (label) => {
    setActionModal((prev) => {
      const selected = Array.isArray(prev.selectedPills) ? prev.selectedPills : [];
      const exists = selected.includes(label);
      const nextSelected = exists ? selected.filter((x) => x !== label) : [...selected, label];
      let nextNotes = String(prev.notes || '');
      if (!exists) {
        if (!nextNotes.trim()) nextNotes = label;
        else if (!nextNotes.includes(label)) nextNotes = `${nextNotes.trim()}\n${label}`;
      } else {
        const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        nextNotes = nextNotes
          .split(/\r?\n/)
          .map((s) => String(s || '').trim())
          .filter((s) => s && !new RegExp(`^${escaped}$`).test(s))
          .join('\n');
      }
      return { ...prev, selectedPills: nextSelected, notes: nextNotes, error: '' };
    });
  };

  const actionConsequenceText = (action) => {
    const a = toKey(action);
    if (a === 'approve') return 'Approve: grants workplace access.';
    if (a === 'resubmission') return 'Request re-upload: rejects current documents and asks for corrected documents (max 3 submissions; after that auto-reject).';
    if (a === 'reject') return 'Reject: permanently blocks this doctor for this workplace.';
    return '';
  };

  const canSubmitAction = () => {
    const actionKey = toKey(actionModal.action);
    if (actionKey === 'approve') return true;
    const notes = String(actionModal.notes || '').trim();
    return !!notes;
  };

  const actionTheme = (action) => {
    const a = toKey(action);
    if (a === 'approve') return { key: 'approve', color: '#0f9d58', icon: 'checkmark-circle-outline' };
    if (a === 'resubmission') return { key: 'resubmission', color: '#1d4ed8', icon: 'refresh-circle-outline' };
    if (a === 'reject') return { key: 'reject', color: '#b91c1c', icon: 'close-circle-outline' };
    return { key: 'unknown', color: '#4f46e5', icon: 'information-circle-outline' };
  };

  const actionPrimaryLabel = (action) => {
    const a = toKey(action);
    if (a === 'approve') return 'Approve';
    if (a === 'resubmission') return 'Request re-upload';
    if (a === 'reject') return 'Reject';
    return 'Confirm';
  };

  const actionEmphasisText = (action) => {
    const a = toKey(action);
    if (a === 'approve') return 'This doctor will get workplace access. Please verify documents before approving.';
    if (a === 'resubmission') return 'This will reject the current documents and ask for a new upload for this application.';
    if (a === 'reject') return 'This doctor will be permanently blocked from joining this workplace.';
    return '';
  };

  const upsertRoleRequest = useCallback((nextRequest) => {
    if (!nextRequest) return;
    setRequests((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      const roleId = nextRequest?.role_id;
      if (!roleId) return arr;
      const idx = arr.findIndex((r) => r?.role_id === roleId);
      if (idx < 0) return [nextRequest, ...arr];
      const copy = arr.slice();
      copy[idx] = nextRequest;
      return copy;
    });
  }, []);

  const ownerActionSuccessMessage = (actionKey) => {
    const a = toKey(actionKey);
    if (a === 'approve') return 'Doctor approved successfully.';
    if (a === 'reject') return 'Doctor rejected successfully.';
    if (a === 'resubmission') return 'Re-upload requested successfully.';
    return 'Action completed successfully.';
  };

  const submitOwnerAction = async () => {
    if (!actionModal.request) return;
    if (!canSubmitAction()) {
      setActionModal((prev) => ({ ...prev, error: 'Review notes are required for this action.' }));
      return;
    }

    setActionModal((prev) => ({ ...prev, submitting: true, error: '' }));
    try {
      const actionKey = toKey(actionModal.action);
      const roleId = actionModal.request?.role_id;
      const reviewNotes = String(actionModal.notes || '').trim();
      if (!placeId || !roleId) throw new Error('Missing placeId or roleId');

      if (actionKey === 'approve') {
        await doctorService.approveOwnerPlaceRoleRequest(placeId, roleId);
      } else if (actionKey === 'reject') {
        await doctorService.rejectOwnerPlaceRoleRequest(placeId, roleId, { review_notes: reviewNotes });
      } else if (actionKey === 'resubmission') {
        await doctorService.requestOwnerPlaceRoleResubmission(placeId, roleId, { review_notes: reviewNotes });
      } else {
        throw new Error('Unsupported action');
      }

      try {
        const updated = await doctorService.getOwnerPlaceRoleReview(placeId, roleId);
        upsertRoleRequest(updated);
      } catch (e) {
        await loadRequests({ isRefreshing: true });
      }

      setActionModal((prev) => ({ ...prev, submitting: false, visible: false }));
      setOverlay({ visible: true, variant: 'success', title: 'Success', message: ownerActionSuccessMessage(actionKey) });
    } catch (e) {
      setActionModal((prev) => ({ ...prev, submitting: false, error: e?.message || 'Unable to submit action' }));
      return;
    }
  };

  const loadRequests = useCallback(
    async ({ isRefreshing = false } = {}) => {
      if (!placeId) return;
      if (!isOwner) {
        setRequests([]);
        setError('Only owner doctor can access doctor requests for this workplace.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setError('');
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);

      try {
        const data = await doctorService.getOwnerPlaceRoleRequests(placeId);
        setRequests(Array.isArray(data) ? data : []);
      } catch (e) {
        const status = e?.status;
        if (status === 403) {
          setError('Only owner doctor can access doctor requests for this workplace.');
        } else {
          setError(e?.message || 'Failed to load doctor requests');
        }
        setRequests([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [placeId, isOwner]
  );

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  const pendingCount = useMemo(() => {
    if (!Array.isArray(requests)) return 0;
    return requests.filter((r) => String(r?.role_status || '').toLowerCase() === 'pending').length;
  }, [requests]);

  const approvedCount = useMemo(() => {
    if (!Array.isArray(requests)) return 0;
    return requests.filter((r) => String(r?.role_status || '').toLowerCase() === 'approved').length;
  }, [requests]);

  const rejectedCount = useMemo(() => {
    if (!Array.isArray(requests)) return 0;
    return requests.filter((r) => String(r?.role_status || '').toLowerCase() === 'rejected').length;
  }, [requests]);

  const sortedRequests = useMemo(() => {
    if (!Array.isArray(requests)) return [];
    const weight = (status) => {
      const s = toKey(status);
      if (s === 'pending') return 0;
      if (s === 'approved') return 1;
      if (s === 'rejected') return 2;
      return 3;
    };

    return [...requests].sort((a, b) => {
      const w = weight(a?.role_status) - weight(b?.role_status);
      if (w !== 0) return w;
      const at = Date.parse(a?.created_at || '') || 0;
      const bt = Date.parse(b?.created_at || '') || 0;
      return bt - at;
    });
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const fk = toKey(filterKey);
    if (fk === 'all') return sortedRequests;
    return sortedRequests.filter((r) => toKey(r?.role_status) === fk);
  }, [sortedRequests, filterKey]);

  const toggleExpanded = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const statusPillStyle = (status) => {
    const s = toKey(status);
    if (s === 'approved') return { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.20)', text: '#0f9d58', icon: 'checkmark-circle-outline' };
    if (s === 'rejected') return { bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.18)', text: '#d93025', icon: 'close-circle-outline' };
    if (s === 'resubmission_requested' || s === 'resubmission requested' || s === 'resubmit_requested')
      return { bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.18)', text: '#1d4ed8', icon: 'refresh-circle-outline' };
    return { bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.22)', text: '#b45309', icon: 'time-outline' };
  };

  const roleIcon = (role) => {
    const r = toKey(role);
    if (r === 'consulting') return 'medkit-outline';
    if (r === 'assistant') return 'person-outline';
    if (r === 'owner') return 'home-outline';
    return 'briefcase-outline';
  };

  const docTypeIcon = (docType) => {
    const t = toKey(docType);
    if (t.includes('degree') || t.includes('certificate')) return 'school-outline';
    if (t.includes('registration')) return 'id-card-outline';
    if (t.includes('authorization')) return 'shield-checkmark-outline';
    if (t.includes('license')) return 'business-outline';
    return 'document-text-outline';
  };

  const openRoleDoc = async (doc) => {
    const docId = docIdOf(doc);
    if (!placeId || !docId) return;
    const key = `role:${docId}`;
    setOpeningKey(key);
    try {
      const dataUrl = await doctorService.getOwnerRoleDocumentFile(placeId, docId);
      await openDocumentDataUrl({
        dataUrl,
        title: doc.document_name || doc.document_type || 'Role Document',
        doc,
        docKind: 'role',
      });
    } catch (e) {
      setOverlay({ visible: true, variant: 'error', title: 'Unable to open document', message: e?.message || 'Something went wrong' });
    } finally {
      setOpeningKey(null);
    }
  };

  const openVerificationDoc = async (doc) => {
    const docId = docIdOf(doc);
    if (!placeId || !docId) return;
    const key = `verification:${docId}`;
    setOpeningKey(key);
    try {
      const dataUrl = await doctorService.getOwnerVerificationDocumentFile(placeId, docId);
      await openDocumentDataUrl({
        dataUrl,
        title: doc.document_name || doc.document_type || 'Verification Document',
        doc,
        docKind: 'verification',
      });
    } catch (e) {
      setOverlay({ visible: true, variant: 'error', title: 'Unable to open document', message: e?.message || 'Something went wrong' });
    } finally {
      setOpeningKey(null);
    }
  };

  const openDocsModal = (kind, docs) => {
    const arr = Array.isArray(docs) ? docs : [];
    const title = kind === 'role' ? 'Role Documents' : 'Doctor Verification Documents';
    setDocsModal({ visible: true, title, docs: arr, kind });
  };

  const closeDocsModal = () => setDocsModal({ visible: false, title: '', docs: [], kind: null });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGrad}>
        <View style={styles.headerGlowA} />
        <View style={styles.headerGlowB} />

        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Doctor Requests</Text>
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.85} onPress={() => loadRequests({ isRefreshing: true })}>
            <Ionicons name="refresh" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerMeta}>
          <View style={styles.metaIconShell}>
            <Ionicons name="briefcase-outline" size={16} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.headerMetaTitle} numberOfLines={1}>
              {activeWorkplace ? workplaceLabel : 'No Workplace Selected'}
            </Text>
            <Text style={styles.headerMetaSubtitle} numberOfLines={2}>
              Review requests from consulting / assistant doctors.
            </Text>
          </View>
        </View>
      </LinearGradient>

      <Modal visible={docsModal.visible} animationType="slide" onRequestClose={closeDocsModal}>
        <SafeAreaView style={styles.viewerContainer}>
          <View style={styles.viewerHeader}>
            <Text style={styles.viewerTitle} numberOfLines={1}>
              {docsModal.title || 'Documents'}
            </Text>
            <TouchableOpacity style={styles.viewerHeaderBtn} activeOpacity={0.9} onPress={closeDocsModal}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
            {docsModal.docs && docsModal.docs.length ? (
              docsModal.docs
                .slice()
                .sort((a, b) => (Date.parse(b?.created_at || '') || 0) - (Date.parse(a?.created_at || '') || 0))
                .map((d) => {
                  const dStatus = statusPillStyle(d?.status);
                  const isRole = docsModal.kind === 'role';
                  const openFn = isRole ? openRoleDoc : openVerificationDoc;
                  const openKey = isRole ? `role:${docIdOf(d)}` : `verification:${docIdOf(d)}`;
                  return (
                    <View key={`${docsModal.kind}_modal_doc_${docIdOf(d) || ''}`} style={styles.docCard}>
                      <View style={styles.docRowTop}>
                        <View style={styles.docLeft}>
                          <View style={styles.docIconShell}>
                            <Ionicons name={docTypeIcon(d?.document_type)} size={16} color="#667eea" />
                          </View>
                          <View style={{ marginLeft: 10, flex: 1 }}>
                            <View style={styles.docHeaderRow}>
                              <Text style={styles.docName}>
                                {d?.document_name || 'Document'}
                              </Text>
                              <View style={[styles.docStatusPill, { backgroundColor: dStatus.bg, borderColor: dStatus.border }]}>
                                <Ionicons name={dStatus.icon} size={11} color={dStatus.text} />
                                <Text style={[styles.docStatusText, { color: dStatus.text }]}>{toHumanLabel(d?.status || '')}</Text>
                              </View>
                            </View>
                            <Text style={styles.docMetaLine} numberOfLines={1}>
                              {toHumanLabel(d?.document_type || '') || 'Document'}
                            </Text>
                            <View style={styles.docTimeRow}>
                              <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
                              <Text style={styles.docTimeText} numberOfLines={1}>
                                {formatDateTime(d?.created_at) || '-'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity style={styles.viewBtn} activeOpacity={0.9} onPress={() => openFn(d)}>
                        {openingKey === openKey ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.viewBtnText}>View</Text>}
                      </TouchableOpacity>
                    </View>
                  );
                })
            ) : (
              <View style={styles.previewStateWrap}>
                <Ionicons name="documents-outline" size={28} color="#e2e8f0" />
                <Text style={styles.previewStateTitle}>No documents</Text>
                <Text style={styles.previewStateSubtitle}>Nothing was uploaded yet.</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={viewer.visible}
        animationType="slide"
        onRequestClose={closeViewer}
      >
        <SafeAreaView style={styles.viewerContainer}>
          <View style={styles.viewerHeader}>
            <Text style={styles.viewerTitle} numberOfLines={1}>
              {viewer.title || 'Document'}
            </Text>
            <TouchableOpacity
              style={styles.viewerHeaderBtn}
              activeOpacity={0.9}
              onPress={closeViewer}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.viewerPreviewShell}>
            {viewer.status === 'missing' ? (
              <View style={styles.previewStateWrap}>
                <Ionicons name="document-text-outline" size={28} color="#e2e8f0" />
                <Text style={styles.previewStateTitle}>Document not available</Text>
                <Text style={styles.previewStateSubtitle}>This file is missing or could not be loaded.</Text>
              </View>
            ) : viewer.status === 'error' ? (
              <View style={styles.previewStateWrap}>
                <Ionicons name="warning-outline" size={28} color="#fecaca" />
                <Text style={styles.previewStateTitle}>Unable to preview</Text>
                <Text style={styles.previewStateSubtitle}>{viewer.error || 'Document is corrupted or unsupported.'}</Text>
              </View>
            ) : viewer.status === 'pdf' ? (
              !!String(viewer.error || '').trim() || !String(viewer.base64 || '').trim() ? (
                <View style={styles.previewStateWrap}>
                  <Ionicons name="warning-outline" size={28} color="#fecaca" />
                  <Text style={styles.previewStateTitle}>Unable to preview</Text>
                  <Text style={styles.previewStateSubtitle}>{String(viewer.error || '').trim() || 'PDF content is missing.'}</Text>
                </View>
              ) : (
                <WebView
                  key={`pdf_${String(viewer?.docKind || '')}_${String(docIdOf(viewer?.doc) || '')}_${String(viewer?.title || '')}`}
                  originWhitelist={['*']}
                  source={{ html: buildPdfHtml(viewer.base64) }}
                  style={{ flex: 1, backgroundColor: '#0b1220' }}
                  onLoadStart={() => setViewerWebLoading(true)}
                  onMessage={(e) => {
                    const msg = String(e?.nativeEvent?.data || '').trim();
                    if (!msg) return;
                    if (msg === 'rendered') {
                      setViewerWebLoading(false);
                      return;
                    }
                    if (msg.startsWith('error:')) {
                      setViewerWebLoading(false);
                      const em = msg.replace(/^error:/, '').trim();
                      setViewer((p) => (p.visible ? { ...p, status: 'error', error: em || 'Unable to preview document.' } : p));
                    }
                  }}
                  onError={() => {
                    setViewerWebLoading(false);
                    setViewer((p) => (p.visible ? { ...p, status: 'error', error: 'Unable to preview document.' } : p));
                  }}
                  javaScriptEnabled
                  domStorageEnabled
                />
              )
            ) : viewer.dataUrl ? (
              <WebView
                key={`img_${String(viewer?.docKind || '')}_${String(docIdOf(viewer?.doc) || '')}_${String(viewer?.title || '')}`}
                originWhitelist={['*']}
                source={{ html: buildImageHtml(viewer.dataUrl) }}
                style={{ flex: 1, backgroundColor: '#0b1220' }}
                allowFileAccess
                onLoadStart={() => setViewerWebLoading(true)}
                onMessage={(e) => {
                  const msg = String(e?.nativeEvent?.data || '').trim();
                  if (!msg) return;
                  if (msg === 'rendered') {
                    setViewerWebLoading(false);
                    return;
                  }
                  if (msg.startsWith('error:')) {
                    setViewerWebLoading(false);
                    const em = msg.replace(/^error:/, '').trim();
                    setViewer((p) => (p.visible ? { ...p, status: 'error', error: em || 'Unable to preview document.' } : p));
                  }
                }}
                onError={() => {
                  setViewerWebLoading(false);
                  setViewer((p) => (p.visible ? { ...p, status: 'error', error: 'Unable to preview document.' } : p));
                }}
                javaScriptEnabled
                domStorageEnabled
              />
            ) : (
              <View style={styles.previewStateWrap}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}

            {viewerWebLoading ? (
              <View style={styles.viewerLoadingOverlay} pointerEvents="none">
                <ActivityIndicator size="large" color="#fff" />
              </View>
            ) : null}
          </View>

          <View style={styles.viewerDetailsDock}>
            <TouchableOpacity
              style={styles.viewerDetailsToggle}
              activeOpacity={0.9}
              onPress={() => setViewerMetaExpanded((v) => !v)}
            >
              <Text style={styles.viewerDetailsToggleText}>{viewerMetaExpanded ? 'Hide details' : 'Show details'}</Text>
              <Ionicons name={viewerMetaExpanded ? 'chevron-down' : 'chevron-up'} size={18} color="#334155" />
            </TouchableOpacity>
          </View>

          {viewerMetaExpanded ? (
            <ScrollView
              style={[
                styles.viewerMetaScroll,
                viewerMetaHeight ? { height: Math.min(viewerMetaHeight, height * 0.42) } : { maxHeight: height * 0.42 },
              ]}
              contentContainerStyle={styles.viewerMetaContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={(w, h) => setViewerMetaHeight(h)}
            >
              <View style={styles.viewerMetaCard}>
                <Text style={styles.viewerMetaTitle}>Metadata</Text>
                <View style={styles.viewerMetaRow}>
                  <Text style={styles.viewerMetaLabel}>Document name</Text>
                  <Text style={styles.viewerMetaValue}>{String(viewer?.doc?.document_name || viewer.title || '').trim() || '-'}</Text>
                </View>
                <View style={styles.viewerMetaRow}>
                  <Text style={styles.viewerMetaLabel}>Document type</Text>
                  <Text style={styles.viewerMetaValue}>{toHumanLabel(viewer?.doc?.document_type || '') || '-'}</Text>
                </View>
                <View style={styles.viewerMetaRow}>
                  <Text style={styles.viewerMetaLabel}>Uploaded at</Text>
                  <Text style={styles.viewerMetaValue}>{formatDateTime(viewer?.doc?.created_at) || '-'}</Text>
                </View>
                <View style={styles.viewerMetaRow}>
                  <Text style={styles.viewerMetaLabel}>Status</Text>
                  <Text style={styles.viewerMetaValue}>{toHumanLabel(viewer?.doc?.status || '') || '-'}</Text>
                </View>
              </View>

              {String(viewer?.doc?.review_notes || '').trim() ? (
                <View style={styles.viewerMetaCard}>
                  <Text style={styles.viewerMetaTitle}>Review</Text>
                  <View style={styles.viewerMetaRowStack}>
                    <Text style={styles.viewerMetaLabel}>Review notes</Text>
                    <Text style={styles.viewerMetaValueStack}>{String(viewer?.doc?.review_notes || '').trim()}</Text>
                  </View>
                  {viewer?.doc?.reviewed_by ? (
                    <View style={styles.viewerMetaRow}>
                      <Text style={styles.viewerMetaLabel}>Reviewed by</Text>
                      <Text style={styles.viewerMetaValue}>{String(viewer.doc.reviewed_by)}</Text>
                    </View>
                  ) : null}
                  {viewer?.doc?.reviewed_at ? (
                    <View style={styles.viewerMetaRow}>
                      <Text style={styles.viewerMetaLabel}>Reviewed at</Text>
                      <Text style={styles.viewerMetaValue}>{formatDateTime(viewer.doc.reviewed_at) || '-'}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={actionModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionModal((p) => ({ ...p, visible: false }))}
      >
        <View style={styles.actionOverlay}>
          <View style={styles.actionCard}>
            <View style={styles.actionHeader}>
              <Text style={styles.actionTitle} numberOfLines={1}>
                {actionTitleLabel(actionModal.action)}
              </Text>
              <TouchableOpacity
                style={styles.actionCloseBtn}
                activeOpacity={0.85}
                onPress={() => setActionModal((p) => ({ ...p, visible: false }))}
              >
                <Ionicons name="close" size={18} color="#2c3e50" />
              </TouchableOpacity>
            </View>

            {actionModal.stage === 'edit' ? (
              <ScrollView style={styles.actionBodyScroll} contentContainerStyle={styles.actionBody} showsVerticalScrollIndicator={false}>
                {(() => {
                  const t = actionTheme(actionModal.action);
                  return actionModal.action ? (
                    <View style={[styles.actionEmphasisCard, { borderColor: `${t.color}22` }]}> 
                      <View style={[styles.actionEmphasisIcon, { backgroundColor: `${t.color}14`, borderColor: `${t.color}22` }]}> 
                        <Ionicons name={t.icon} size={16} color={t.color} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.actionEmphasisTitle}>{actionPrimaryLabel(actionModal.action)}</Text>
                        <Text style={styles.actionEmphasisSubtitle}>
                          {actionConsequenceText(actionModal.action)}
                        </Text>
                      </View>
                    </View>
                  ) : null;
                })()}

                {toKey(actionModal.action) === 'approve' ? (
                  <View style={styles.infoCard}>
                    <View style={styles.infoCardHeader}>
                      <View style={styles.infoCardIcon}>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#0f9d58" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.infoCardTitle}>Approve role</Text>
                        <Text style={styles.infoCardSubtitle}>No review notes are required for approval.</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.reviewCard}>
                    {(() => {
                      const c = reviewCardCopy(actionModal.action);
                      return (
                    <View style={styles.reviewCardHeader}>
                      <View style={styles.reviewCardIcon}>
                        <Ionicons name="chatbubble-ellipses-outline" size={16} color="#4f46e5" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.reviewCardTitle}>{c.title}</Text>
                        <Text style={styles.reviewCardSubtitle}>{c.subtitle}</Text>
                      </View>
                    </View>
                      );
                    })()}

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScrollContent}>
                      {reviewPillsForAction(actionModal.action).map((label) => {
                        const active = Array.isArray(actionModal.selectedPills) && actionModal.selectedPills.includes(label);
                        return (
                          <TouchableOpacity
                            key={label}
                            activeOpacity={0.9}
                            style={[styles.reviewPill, active && styles.reviewPillActive]}
                            onPress={() => toggleReviewPill(label)}
                          >
                            <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={active ? '#4f46e5' : '#94a3b8'} />
                            <Text style={[styles.reviewPillText, active && styles.reviewPillTextActive]}>{label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    <TextInput
                      value={actionModal.notes}
                      onChangeText={(t) => setActionModal((p) => ({ ...p, notes: t, error: '' }))}
                      placeholder="Write review notes…"
                      placeholderTextColor="#94a3b8"
                      multiline
                      style={styles.reviewInput}
                    />
                  </View>
                )}

                {!!actionModal.error ? <Text style={styles.actionErrorText}>{actionModal.error}</Text> : null}

                <View style={styles.actionBtnRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnGhost]}
                    activeOpacity={0.9}
                    onPress={() => setActionModal((p) => ({ ...p, visible: false }))}
                    disabled={actionModal.submitting}
                  >
                    <Text style={styles.actionBtnGhostText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnPrimary]}
                    activeOpacity={0.9}
                    onPress={() => setActionModal((p) => ({ ...p, stage: 'confirm', error: '' }))}
                    disabled={actionModal.submitting}
                  >
                    <Text style={styles.actionBtnPrimaryText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : (
              <ScrollView style={styles.actionBodyScroll} contentContainerStyle={styles.actionBody} showsVerticalScrollIndicator={false}>
                {(() => {
                  const t = actionTheme(actionModal.action);
                  return (
                    <View style={[styles.actionConfirmBanner, { borderColor: `${t.color}22` }]}> 
                      <View style={[styles.actionConfirmIcon, { backgroundColor: `${t.color}14`, borderColor: `${t.color}22` }]}> 
                        <Ionicons name={t.icon} size={16} color={t.color} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.actionEmphasisTitle}>Confirm</Text>
                        <Text style={styles.actionEmphasisSubtitle}>
                          {actionConsequenceText(actionModal.action)}
                        </Text>
                      </View>
                    </View>
                  );
                })()}

                {(() => {
                  const w = actionWarningCopy(actionModal.action);
                  if (!w) return null;
                  return (
                    <View style={styles.actionWarningCard}>
                      <View style={styles.actionWarningHeader}>
                        <View style={styles.actionWarningIcon}>
                          <Ionicons name="warning-outline" size={16} color="#b45309" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.actionWarningTitle}>{w.title}</Text>
                          <Text style={styles.actionWarningText}>
                            {w.body}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}

                {toKey(actionModal.action) !== 'approve' ? (
                  <View style={styles.confirmBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="document-text-outline" size={14} color="#334155" />
                      <Text style={[styles.confirmBoxTitle, { marginLeft: 8 }]}>Review notes</Text>
                    </View>
                    <Text style={styles.confirmBoxText}>{String(actionModal.notes || '').trim() || '-'}</Text>
                  </View>
                ) : null}

                {!!actionModal.error ? <Text style={styles.actionErrorText}>{actionModal.error}</Text> : null}

                <View style={styles.actionBtnRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnGhost]}
                    activeOpacity={0.9}
                    onPress={() => setActionModal((p) => ({ ...p, visible: false }))}
                    disabled={actionModal.submitting}
                  >
                    <Text style={styles.actionBtnGhostText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, toKey(actionModal.action) === 'approve' ? styles.actionBtnPrimary : styles.actionBtnDanger]}
                    activeOpacity={0.9}
                    onPress={submitOwnerAction}
                    disabled={actionModal.submitting}
                  >
                    {actionModal.submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.actionBtnPrimaryText}>Confirm</Text>}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {loading ? (
        <LoadingState fullScreen message="Loading doctor requests..." />
      ) : (
        <FlatList
          data={placeId ? filteredRequests : []}
          keyExtractor={(item) => {
            const doctorId = item?.doctor?.doctor_id ?? item?.doctor?.id ?? '';
            return `${item?.role_id || ''}_${doctorId}`;
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadRequests({ isRefreshing: true })} />}
          ListHeaderComponent={
            <View>
              <ErrorState message={error} onRetry={() => loadRequests()} fullWidth />

              {!placeId ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconShell}>
                    <Ionicons name="briefcase-outline" size={22} color="#667eea" />
                  </View>
                  <Text style={styles.emptyTitle}>No workplace selected</Text>
                  <Text style={styles.emptySubtitle}>Select a workplace to view doctor join requests.</Text>
                </View>
              ) : (
                <View style={styles.toolbarCard}>
                  <View style={styles.toolbarTopRow}>
                    <Text style={styles.toolbarTitle}>Requests</Text>
                    <View style={styles.toolbarCountBadge}>
                      <Ionicons name="mail-outline" size={12} color="#4f46e5" />
                      <Text style={styles.toolbarCountText}>{Array.isArray(requests) ? requests.length : 0}</Text>
                    </View>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={[styles.filterPill, toKey(filterKey) === 'all' && styles.filterPillActive]}
                      onPress={() => setFilterKey('all')}
                    >
                      <Text style={[styles.filterPillText, toKey(filterKey) === 'all' && styles.filterPillTextActive]}>All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={[styles.filterPill, toKey(filterKey) === 'pending' && styles.filterPillActive]}
                      onPress={() => setFilterKey('pending')}
                    >
                      <Text style={[styles.filterPillText, toKey(filterKey) === 'pending' && styles.filterPillTextActive]}>Pending</Text>
                      <View style={styles.filterMiniCount}>
                        <Text style={styles.filterMiniCountText}>{pendingCount}</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={[styles.filterPill, toKey(filterKey) === 'approved' && styles.filterPillActive]}
                      onPress={() => setFilterKey('approved')}
                    >
                      <Text style={[styles.filterPillText, toKey(filterKey) === 'approved' && styles.filterPillTextActive]}>Approved</Text>
                      <View style={styles.filterMiniCount}>
                        <Text style={styles.filterMiniCountText}>{approvedCount}</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={[styles.filterPill, toKey(filterKey) === 'rejected' && styles.filterPillActive]}
                      onPress={() => setFilterKey('rejected')}
                    >
                      <Text style={[styles.filterPillText, toKey(filterKey) === 'rejected' && styles.filterPillTextActive]}>Rejected</Text>
                      <View style={styles.filterMiniCount}>
                        <Text style={styles.filterMiniCountText}>{rejectedCount}</Text>
                      </View>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            placeId && !error ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconShell}>
                  <Ionicons name="mail-outline" size={22} color="#667eea" />
                </View>
                <Text style={styles.emptyTitle}>No requests found</Text>
                <Text style={styles.emptySubtitle}>When doctors request access, they’ll appear here.</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const r = item;
            const doctor = r?.doctor || {};
            const key = `${r?.role_id || ''}_${doctor?.doctor_id || doctor?.id || ''}`;
            const requestedRole = String(r?.requested_role || '').toLowerCase();
            const roleLabel = requestedRole ? toTitleCaseWords(requestedRole.replace(/_/g, ' ')) : 'Role';
            const roleChipLabel = requestedRole ? `Workplace role: ${roleLabel}` : 'Workplace role';
            const status = statusPillStyle(r?.role_status);
            const statusLabel = toTitleCaseWords(r?.role_status || 'pending');
            const roleDocs = Array.isArray(r?.role_documents) ? r.role_documents : [];
            const roleDocsSorted = [...roleDocs].sort((a, b) => {
              const at = Date.parse(a?.created_at || '') || 0;
              const bt = Date.parse(b?.created_at || '') || 0;
              return bt - at;
            });
            const verificationDocs = Array.isArray(r?.doctor_verification_documents) ? r.doctor_verification_documents : [];
            const isExpanded = !!expanded[key];
            const requestStatusKey = toKey(r?.role_status);
            const attemptsCountRaw = r?.attempt_count ?? r?.role_doc_attempts_count ?? r?.doc_attempts_count ?? r?.attempts_count ?? r?.attempts ?? null;
            const attemptsCount = Number.isFinite(Number(attemptsCountRaw)) ? Number(attemptsCountRaw) : null;
            const attemptsMax = 3;
            const attemptsExceeded = attemptsCount != null ? attemptsCount >= attemptsMax : false;
            const canAct = requestStatusKey === 'pending';
            const requestedOn = roleDocsSorted && roleDocsSorted.length ? formatDateTime(roleDocsSorted[0]?.created_at) : '';
            const attemptStyle = attemptTone(attemptsCount);

            return (
              <View style={styles.requestCard}>
                <TouchableOpacity activeOpacity={0.9} onPress={() => toggleExpanded(key)} style={styles.requestTapRow}>
                  <View style={styles.avatarShell}>
                    <Text style={styles.avatarInitial}>{String(doctor?.full_name || 'D').trim().charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.requestTopLine}>
                      <Text style={styles.requestName} numberOfLines={1}>
                        {doctor?.full_name || 'Doctor'}
                      </Text>
                      <View style={[styles.statusChip, { backgroundColor: status.bg, borderColor: status.border }]}>
                        <Ionicons name={status.icon} size={12} color={status.text} />
                        <Text style={[styles.statusChipText, { color: status.text }]}>{statusLabel}</Text>
                      </View>
                    </View>
                    <Text style={styles.requestSubText} numberOfLines={1}>
                      {doctor?.specialization ? toTitleCaseWords(doctor.specialization) : 'Specialization not provided'}
                    </Text>
                    <View>
                      <View style={styles.requestMetaRow}>
                        <View style={styles.metaChip}>
                          <Ionicons name={roleIcon(requestedRole)} size={12} color="#64748b" />
                          <Text style={styles.metaChipText}>{roleChipLabel}</Text>
                        </View>
                      </View>
                      {!!requestedOn && (
                        <View style={styles.docTimeRow}>
                          <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
                          <Text style={styles.docTimeText} numberOfLines={1}>
                            {requestedOn}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#94a3b8" />
                </TouchableOpacity>

                {isExpanded ? (
                  <View style={styles.expandBody}>
                    <View style={styles.detailGrid}>
                      <View style={styles.detailRow}>
                        <Ionicons name="mail-outline" size={14} color="#64748b" />
                        <Text style={styles.detailText} numberOfLines={1}>
                          {doctor?.email || 'Email not provided'}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="call-outline" size={14} color="#64748b" />
                        <Text style={styles.detailText} numberOfLines={1}>
                          {doctor?.phone_number || 'Phone not provided'}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="id-card-outline" size={14} color="#64748b" />
                        <Text style={styles.detailText} numberOfLines={1}>
                          {doctor?.registration_number ? `Reg: ${doctor.registration_number}` : 'Registration not provided'}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="ribbon-outline" size={14} color="#64748b" />
                        <Text style={styles.detailText} numberOfLines={1}>
                          {doctor?.registration_council ? `Council: ${doctor.registration_council}` : 'Council not provided'}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={14} color="#64748b" />
                        <Text style={styles.detailText} numberOfLines={1}>
                          {Number.isFinite(Number(doctor?.experience_years)) ? `Experience: ${doctor.experience_years} years` : 'Experience not provided'}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="school-outline" size={14} color="#64748b" />
                        <Text style={styles.detailText} numberOfLines={2}>
                          {doctor?.qualifications || 'Qualifications not provided'}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        {verificationDocs.length ? (
                          (() => {
                            const verificationDocsSorted = [...verificationDocs].sort(
                              (a, b) => (Date.parse(b?.created_at || '') || 0) - (Date.parse(a?.created_at || '') || 0)
                            );
                            const label = 'View Doctor Verification Docs';
                            return (
                              <TouchableOpacity
                                style={[styles.detailLinkBtn, { flex: 1 }]}
                                activeOpacity={0.9}
                                onPress={() => openDocsModal('verification', verificationDocsSorted)}
                              >
                                <View style={styles.detailLinkBtnInner}>
                                  <Text style={styles.detailLinkText} numberOfLines={1}>
                                    {label}
                                  </Text>
                                  <Ionicons name="chevron-forward" size={16} color="#4f46e5" />
                                </View>
                              </TouchableOpacity>
                            );
                          })()
                        ) : (
                          <Text style={styles.detailText} numberOfLines={1}>
                            No verification documents.
                          </Text>
                        )}
                      </View>

                      {verificationDocs.length > 1 ? (
                        <View style={styles.detailRow}>
                          <Ionicons name="documents-outline" size={14} color="#64748b" />
                          <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.9} onPress={() => openDocsModal('verification', verificationDocs)}>
                            <Text style={[styles.detailText, { color: '#64748b' }]} numberOfLines={1}>
                              View all verification documents ({verificationDocs.length})
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>

                    <View style={[styles.docsSection, styles.docsSectionPrimary]}>
                      <View style={styles.docsTitleRow}>
                        <Ionicons name="folder-open-outline" size={14} color="#334155" />
                        <Text style={[styles.docsTitle, { marginLeft: 8 }]}>Role Documents (Action Required)</Text>
                      </View>
                      {roleDocsSorted.length ? (
                        (() => {
                          const d = roleDocsSorted[0];
                          const dId = docIdOf(d);
                          const dStatus = statusPillStyle(d?.status);
                          return (
                            <View>
                              <View key={`role_doc_${dId || ''}`} style={styles.docCard}>
                                <View style={styles.docRowTop}>
                                  <View style={styles.docLeft}>
                                    <View style={styles.docIconShell}>
                                      <Ionicons name={docTypeIcon(d?.document_type)} size={16} color="#667eea" />
                                    </View>
                                    <View style={{ marginLeft: 10, flex: 1 }}>
                                      <View style={styles.docHeaderRow}>
                                        <Text style={styles.docName} numberOfLines={1}>
                                          {d?.document_name || 'Document'}
                                        </Text>
                                        <View style={[styles.docStatusPill, { backgroundColor: dStatus.bg, borderColor: dStatus.border }]}>
                                          <Ionicons name={dStatus.icon} size={11} color={dStatus.text} />
                                          <Text style={[styles.docStatusText, { color: dStatus.text }]}>{toHumanLabel(d?.status || '')}</Text>
                                        </View>
                                      </View>
                                      <Text style={styles.docMetaLine} numberOfLines={1}>
                                        {toHumanLabel(d?.document_type || '') || 'Document'}
                                      </Text>
                                      <View style={styles.docTimeRow}>
                                        <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
                                        <Text style={styles.docTimeText} numberOfLines={1}>
                                          {formatDateTime(d?.created_at) || '-'}
                                        </Text>
                                      </View>
                                    </View>
                                  </View>
                                </View>
                                <TouchableOpacity style={styles.viewBtn} activeOpacity={0.9} onPress={() => openRoleDoc(d)}>
                                  {openingKey === `role:${dId}` ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.viewBtnText}>View</Text>}
                                </TouchableOpacity>
                              </View>
                              {roleDocsSorted.length > 1 ? (
                                <TouchableOpacity style={{ marginTop: 10 }} activeOpacity={0.9} onPress={() => openDocsModal('role', roleDocsSorted)}>
                                  <Text style={[styles.detailText, { color: '#64748b', textAlign: 'center' }]} numberOfLines={1}>
                                    View all role documents ({roleDocsSorted.length})
                                  </Text>
                                </TouchableOpacity>
                              ) : null}
                            </View>
                          );
                        })()
                      ) : (
                        <Text style={styles.docEmpty}>No role documents attached.</Text>
                      )}
                    </View>

                    <View style={styles.docsSection}>
                      <View style={styles.docsTitleRow}>
                        <Ionicons name="flash-outline" size={14} color="#334155" />
                        <Text style={[styles.docsTitle, { marginLeft: 8 }]}>Owner Actions</Text>
                      </View>
                      {attemptsCount != null ? (
                        <View style={styles.attemptRow}>
                          <View style={[styles.attemptBadge, { backgroundColor: attemptStyle.bg, borderColor: attemptStyle.border }]}>
                            <Ionicons name="reload" size={14} color={attemptStyle.text} />
                          </View>
                          <Text style={[styles.attemptText, { color: attemptStyle.text }]} numberOfLines={1}>
                            Submissions: {attemptsCount} / {attemptsMax}
                          </Text>
                        </View>
                      ) : null}

                      {requestStatusKey === 'rejected' ? (
                        <View style={styles.lockedBox}>
                          <Ionicons name="lock-closed-outline" size={14} color="#b91c1c" />
                          <Text style={styles.lockedText} numberOfLines={3}>
                            {String(r?.role_rejection_reason || '').trim() ? `Rejected: ${String(r.role_rejection_reason).trim()}` : 'Rejected. This doctor is permanently blocked from joining this workplace.'}
                          </Text>
                        </View>
                      ) : requestStatusKey === 'resubmission_requested' || requestStatusKey === 'resubmission requested' ? (
                        <View style={styles.lockedBox}>
                          <Ionicons name="time-outline" size={14} color="#1d4ed8" />
                          <Text style={[styles.lockedText, { color: '#1d4ed8' }]} numberOfLines={2}>
                            Waiting for doctor to upload new role documents.
                          </Text>
                        </View>
                      ) : null}

                      {!canAct ? (
                        <Text style={styles.docEmpty}>No actions available for {toHumanLabel(r?.role_status || '') || 'this status'}.</Text>
                      ) : (
                        <View style={styles.ownerActionsRow}>
                          <TouchableOpacity
                            style={[styles.ownerActionBtn, styles.ownerActionApprove]}
                            activeOpacity={0.9}
                            onPress={() => openAction('approve', r)}
                          >
                            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                            <Text style={styles.ownerActionText}>Approve</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.ownerActionBtn, styles.ownerActionResubmit, attemptsExceeded && styles.ownerActionDisabled]}
                            activeOpacity={0.9}
                            onPress={() => {
                              if (attemptsExceeded) {
                                setOverlay({
                                  visible: true,
                                  variant: 'warning',
                                  title: 'Resubmission limit reached',
                                  message: `This doctor has already submitted documents ${attemptsCount}/${attemptsMax} times. After 3 submissions, the request will be automatically rejected for this workplace.`,
                                });
                                return;
                              }
                              openAction('resubmission', r);
                            }}
                            disabled={attemptsExceeded}
                          >
                            <Ionicons name="refresh-outline" size={16} color="#fff" />
                            <Text style={styles.ownerActionText}>Re-upload</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.ownerActionBtn, styles.ownerActionReject]}
                            activeOpacity={0.9}
                            onPress={() => openAction('reject', r)}
                          >
                            <Ionicons name="close-circle-outline" size={16} color="#fff" />
                            <Text style={styles.ownerActionText}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                ) : null}
              </View>
            );
          }}
          ListFooterComponent={<View style={{ height: 120 }} />}
        />
      )}

      {overlay.visible ? (
        <View style={styles.overlayBackdrop}>
          <View style={styles.overlayCard}>
            <View style={styles.successIconWrap}>
              <View
                style={[
                  styles.successIconInner,
                  overlay.variant === 'success'
                    ? { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' }
                    : overlay.variant === 'warning'
                      ? { backgroundColor: '#fff7ed', borderColor: '#fed7aa' }
                      : overlay.variant === 'error'
                        ? { backgroundColor: '#fef2f2', borderColor: '#fecaca' }
                        : { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' },
                ]}
              >
                <Ionicons
                  name={
                    overlay.variant === 'success'
                      ? 'checkmark'
                      : overlay.variant === 'warning'
                        ? 'alert'
                        : overlay.variant === 'error'
                          ? 'close'
                          : 'information'
                  }
                  size={46}
                  color={
                    overlay.variant === 'success'
                      ? '#16a34a'
                      : overlay.variant === 'warning'
                        ? '#f59e0b'
                        : overlay.variant === 'error'
                          ? '#b91c1c'
                          : '#667eea'
                  }
                />
              </View>
            </View>
            <Text style={styles.successTitle}>{overlay.title || 'Message'}</Text>
            <Text style={styles.successSubtitle}>{overlay.message || ''}</Text>
            <TouchableOpacity
              style={styles.overlayPrimaryBtn}
              activeOpacity={0.9}
              onPress={() => setOverlay({ visible: false, variant: 'info', title: '', message: '' })}
            >
              <Text style={styles.overlayPrimaryText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },

  headerGrad: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
  },
  headerGlowA: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.15)',
    top: -70,
    right: -40,
  },
  headerGlowB: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.10)',
    bottom: -70,
    left: -40,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerMeta: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    padding: 12,
  },
  metaIconShell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMetaTitle: { color: '#fff', fontWeight: '900', fontSize: 14 },
  headerMetaSubtitle: { marginTop: 4, color: 'rgba(255,255,255,0.84)', fontSize: 12, lineHeight: 16 },

  scrollContent: { paddingHorizontal: 16, paddingTop: 12 },

  toolbarCard: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#edf0f5',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  toolbarTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toolbarTitle: { fontSize: 14, fontWeight: '900', color: '#0f172a' },
  toolbarCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102,126,234,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  toolbarCountText: { marginLeft: 6, color: '#4f46e5', fontWeight: '900', fontSize: 12 },
  filterScrollContent: { paddingTop: 12, paddingBottom: 2 },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 10,
  },
  filterPillActive: { backgroundColor: 'rgba(102,126,234,0.10)', borderColor: 'rgba(102,126,234,0.22)' },
  filterPillText: { fontSize: 12, fontWeight: '900', color: '#64748b' },
  filterPillTextActive: { color: '#4f46e5' },
  filterMiniCount: { marginLeft: 8, backgroundColor: '#0f172a', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  filterMiniCountText: { color: '#fff', fontSize: 11, fontWeight: '900' },

  emptyCard: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#edf0f5',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
    alignItems: 'center',
  },
  emptyIconShell: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(102,126,234,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: { marginTop: 12, fontSize: 15, fontWeight: '900', color: '#2c3e50' },
  emptySubtitle: { marginTop: 6, textAlign: 'center', color: '#7f8c8d', fontSize: 12, lineHeight: 18 },

  demoLabel: { marginTop: 16, color: '#7f8c8d', fontSize: 12, fontWeight: '800' },

  requestCard: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#edf0f5',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  requestTapRow: { flexDirection: 'row', alignItems: 'center' },
  avatarShell: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(102,126,234,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { fontSize: 16, fontWeight: '900', color: '#4f46e5' },
  requestName: { fontSize: 14, fontWeight: '900', color: '#2c3e50' },
  requestSubText: { marginTop: 2, color: '#64748b', fontSize: 12, fontWeight: '800' },
  requestedInlineRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center' },
  requestedInlineText: { marginLeft: 8, fontSize: 11, fontWeight: '800', color: '#94a3b8', flex: 1 },
  requestTopLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, marginLeft: 10 },
  statusChipText: { marginLeft: 6, fontSize: 12, fontWeight: '900' },
  requestMetaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  metaChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: 'rgba(241,245,249,0.92)', marginRight: 8, marginBottom: 8, maxWidth: '100%' },
  metaChipText: { marginLeft: 6, fontSize: 12, fontWeight: '900', color: '#64748b', maxWidth: 190 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, marginRight: 8, marginBottom: 8 },
  pillText: { marginLeft: 6, fontSize: 12, fontWeight: '900' },
  pillNeutral: { backgroundColor: 'rgba(241,245,249,0.92)', borderColor: '#e2e8f0' },
  pillNeutralText: { color: '#64748b' },

  filterRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: '#edf0f5', marginRight: 10, marginBottom: 10 },
  filterChipActive: { backgroundColor: 'rgba(102,126,234,0.10)', borderColor: 'rgba(102,126,234,0.18)' },
  filterText: { fontSize: 12, fontWeight: '900', color: '#64748b' },
  filterTextActive: { color: '#4f46e5' },

  expandBody: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#edf0f5' },
  detailGrid: { padding: 12, borderRadius: 14, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#eef2f7' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  detailText: { marginLeft: 10, color: '#2c3e50', fontSize: 12, fontWeight: '800', flex: 1 },

  detailLinkBtn: { backgroundColor: 'rgba(79,70,229,0.10)', borderWidth: 1, borderColor: 'rgba(79,70,229,0.18)', borderRadius: 12 },
  detailLinkBtnInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 9 },
  detailLinkIconShell: {
    width: 26,
    height: 26,
    borderRadius: 10,
    backgroundColor: 'rgba(79,70,229,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(79,70,229,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  detailLinkText: { marginLeft: 0, marginRight: 8, fontSize: 12, fontWeight: '900', color: '#4f46e5', flex: 1 },

  docsSection: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#edf0f5' },
  docsSectionPrimary: { borderRadius: 14, padding: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(102,126,234,0.22)' },
  docsSectionSecondary: { borderRadius: 14, padding: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  docsTitleRow: { flexDirection: 'row', alignItems: 'center' },
  docsTitle: { fontSize: 12, fontWeight: '900', color: '#2c3e50' },
  docsTitleMuted: { fontSize: 12, fontWeight: '900', color: '#64748b' },
  docCard: { marginTop: 10, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#edf0f5', padding: 12 },
  docCardMuted: { backgroundColor: 'rgba(255,255,255,0.65)' },
  docRowTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  docLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  docIconShell: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(102,126,234,0.10)', borderWidth: 1, borderColor: 'rgba(102,126,234,0.14)', alignItems: 'center', justifyContent: 'center' },
  docIconShellGreen: { backgroundColor: 'rgba(34,197,94,0.10)', borderColor: 'rgba(34,197,94,0.18)' },
  docName: { fontSize: 12, fontWeight: '900', color: '#2c3e50', flex: 1, marginRight: 10 },
  docHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  docMetaLine: { marginTop: 6, fontSize: 11, color: '#64748b', fontWeight: '800' },
  docMetaLineMuted: { marginTop: 6, fontSize: 11, color: '#94a3b8', fontWeight: '800' },
  docTimeRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  docTimeText: { marginLeft: 6, fontSize: 11, color: '#64748b', fontWeight: '800', flex: 1 },
  docTimeTextMuted: { marginLeft: 6, fontSize: 11, color: '#94a3b8', fontWeight: '800', flex: 1 },
  docStatusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  docStatusText: { marginLeft: 5, fontSize: 11, fontWeight: '900' },
  docEmpty: { marginTop: 8, fontSize: 12, color: '#7f8c8d' },
  viewBtn: { marginTop: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#4f46e5', minWidth: 74, alignItems: 'center' },
  viewBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },

  docActionRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  docActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14 },
  docActionText: { marginLeft: 8, fontSize: 12, fontWeight: '900', color: '#fff' },
  docActionApprove: { backgroundColor: '#0f9d58', marginRight: 10 },
  docActionResubmit: { backgroundColor: '#1d4ed8' },
  docActionDisabled: { opacity: 0.45 },

  viewerContainer: { flex: 1, backgroundColor: '#0b1220' },
  viewerHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: 'rgba(15,23,42,0.96)', borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.18)' },
  viewerHeaderBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' },
  viewerHeaderSpacer: { width: 40, height: 40 },
  viewerTitle: { flex: 1, fontSize: 14, fontWeight: '900', color: '#fff', textAlign: 'left', marginRight: 12 },
  viewerPreviewShell: { flex: 1, backgroundColor: '#0b1220' },
  viewerLoadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11,18,32,0.55)' },
  viewerMetaScroll: { backgroundColor: '#F8F9FA', maxHeight: height * 0.42 },
  viewerMetaContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  viewerMetaCard: { backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#edf0f5', marginBottom: 12 },
  viewerMetaTitle: { fontSize: 12, fontWeight: '900', color: '#0f172a' },
  viewerMetaRow: { marginTop: 12, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  viewerMetaRowStack: { marginTop: 12 },
  viewerMetaLabel: { fontSize: 12, fontWeight: '800', color: '#64748b', marginRight: 14, flex: 1 },
  viewerMetaValue: { fontSize: 12, fontWeight: '900', color: '#0f172a', flex: 1, textAlign: 'right' },
  viewerMetaValueStack: { marginTop: 8, fontSize: 12, fontWeight: '800', color: '#0f172a', lineHeight: 18 },
  viewerPrimaryBtn: { marginTop: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f46e5', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14 },
  viewerPrimaryBtnText: { marginLeft: 8, color: '#fff', fontSize: 14, fontWeight: '800' },
  pdfErrorText: { marginTop: 10, color: '#fecaca', fontSize: 12, fontWeight: '800', textAlign: 'center', lineHeight: 17 },
  viewerDetailsDock: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eef2f7' },
  viewerDetailsToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  viewerDetailsToggleText: { color: '#334155', fontSize: 13, fontWeight: '900' },

  previewStateWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  previewStateTitle: { marginTop: 12, fontSize: 14, fontWeight: '900', color: '#fff', textAlign: 'center' },
  previewStateSubtitle: { marginTop: 6, fontSize: 12, fontWeight: '700', color: 'rgba(226,232,240,0.85)', textAlign: 'center', lineHeight: 18 },
  previewLoaderOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 2, backgroundColor: 'rgba(11,18,32,0.65)' },
  previewLoaderText: { marginTop: 10, fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.92)' },
  previewPdfBtn: { marginTop: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14 },
  previewPdfBtnText: { marginLeft: 8, color: '#fff', fontSize: 12, fontWeight: '900' },

  actionOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 18 },
  actionCard: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden' },
  actionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#edf0f5' },
  actionTitle: { flex: 1, fontSize: 14, fontWeight: '900', color: '#2c3e50', marginRight: 10 },
  actionCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  actionBody: { padding: 14 },
  actionBodyScroll: { maxHeight: height * 0.72 },
  actionSubTitle: { fontSize: 12, fontWeight: '900', color: '#2c3e50' },
  actionHelpText: { marginTop: 6, fontSize: 12, fontWeight: '700', color: '#64748b', lineHeight: 18 },
  actionConsequencePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(79,70,229,0.08)', borderWidth: 1, borderColor: 'rgba(79,70,229,0.14)', marginBottom: 12 },
  actionConsequencePillText: { marginLeft: 8, fontSize: 12, fontWeight: '800', color: '#4f46e5', flex: 1 },
  actionEmphasisCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  actionEmphasisIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionEmphasisTitle: { fontSize: 12, fontWeight: '900', color: '#0f172a' },
  actionEmphasisSubtitle: { marginTop: 2, fontSize: 11, fontWeight: '700', color: '#64748b', lineHeight: 16 },

  actionWarningCard: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.22)',
    padding: 12,
  },
  actionWarningHeader: { flexDirection: 'row', alignItems: 'center' },
  actionWarningIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionWarningTitle: { fontSize: 12, fontWeight: '900', color: '#0f172a' },
  actionWarningText: { marginTop: 2, fontSize: 11, fontWeight: '700', color: '#92400e', lineHeight: 16 },

  actionDetailsCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#edf0f5',
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginBottom: 12,
  },
  actionDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  actionDetailsHeaderText: { marginLeft: 8, fontSize: 12, fontWeight: '900', color: '#334155', flex: 1 },
  actionDetailsHint: { paddingHorizontal: 12, paddingVertical: 10, fontSize: 11, fontWeight: '700', color: '#64748b', lineHeight: 16 },
  actionDetailsScroll: { maxHeight: 160 },
  actionDetailsContent: { paddingHorizontal: 12, paddingVertical: 10 },
  actionDetailsRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  actionDetailsLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', marginRight: 12, flex: 1 },
  actionDetailsValue: { fontSize: 11, fontWeight: '900', color: '#0f172a', flex: 1, textAlign: 'right', lineHeight: 16 },

  actionConfirmBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  actionConfirmIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsScrollContent: { paddingVertical: 12 },
  reviewCard: { borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#edf0f5', padding: 12 },
  reviewCardHeader: { flexDirection: 'row', alignItems: 'center' },
  reviewCardIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(102,126,234,0.12)', borderWidth: 1, borderColor: 'rgba(102,126,234,0.18)', alignItems: 'center', justifyContent: 'center' },
  reviewCardTitle: { fontSize: 12, fontWeight: '900', color: '#0f172a' },
  reviewCardSubtitle: { marginTop: 2, fontSize: 11, fontWeight: '700', color: '#64748b' },
  reviewPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 10 },
  reviewPillActive: { backgroundColor: 'rgba(102,126,234,0.10)', borderColor: 'rgba(102,126,234,0.22)' },
  reviewPillText: { marginLeft: 8, fontSize: 12, fontWeight: '900', color: '#64748b' },
  reviewPillTextActive: { color: '#4f46e5' },
  reviewInput: { marginTop: 8, minHeight: 98, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, fontSize: 12, fontWeight: '800', color: '#0f172a', backgroundColor: '#f8fafc' },
  actionErrorText: { marginTop: 10, color: '#b91c1c', fontSize: 12, fontWeight: '800', lineHeight: 18 },
  actionBtnRow: { marginTop: 14, flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionBtnGhost: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 10 },
  actionBtnGhostText: { fontSize: 12, fontWeight: '900', color: '#334155' },
  actionBtnPrimary: { backgroundColor: '#4f46e5' },
  actionBtnPrimaryText: { fontSize: 12, fontWeight: '900', color: '#fff' },
  actionBtnDanger: { backgroundColor: '#b91c1c' },
  confirmBox: { marginTop: 12, borderRadius: 14, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', padding: 12 },
  confirmBoxTitle: { fontSize: 12, fontWeight: '900', color: '#334155' },
  confirmBoxText: { marginTop: 8, fontSize: 12, fontWeight: '800', color: '#0f172a', lineHeight: 18 },

  infoCard: { borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#edf0f5', padding: 12 },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center' },
  infoCardIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(34,197,94,0.10)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.18)', alignItems: 'center', justifyContent: 'center' },
  infoCardTitle: { fontSize: 12, fontWeight: '900', color: '#0f172a' },
  infoCardSubtitle: { marginTop: 2, fontSize: 11, fontWeight: '700', color: '#64748b' },

  ownerActionsRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  ownerActionsHint: { marginTop: 8, fontSize: 12, fontWeight: '800', color: '#64748b', lineHeight: 18 },
  ownerActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14 },
  ownerActionText: { marginLeft: 6, fontSize: 12, fontWeight: '900', color: '#fff' },
  ownerActionApprove: { backgroundColor: '#0f9d58', marginRight: 10 },
  ownerActionResubmit: { backgroundColor: '#1d4ed8', marginRight: 10 },
  ownerActionReject: { backgroundColor: '#b91c1c' },
  ownerActionDisabled: { opacity: 0.45 },
  attemptRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  attemptBadge: { width: 32, height: 32, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  attemptText: { marginLeft: 10, fontSize: 12, fontWeight: '900', flex: 1 },

  lockedBox: { marginTop: 10, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#fee2e2', backgroundColor: 'rgba(239,68,68,0.08)' },
  lockedText: { marginLeft: 10, fontSize: 12, fontWeight: '800', color: '#b91c1c', flex: 1, lineHeight: 18 },

  overlayBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  overlayCard: { width: '92%', borderRadius: 22, paddingVertical: 24, paddingHorizontal: 20, backgroundColor: '#fff', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 20, elevation: 12 },
  successIconWrap: { width: 100, height: 100, marginBottom: 16 },
  successIconInner: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  successTitle: { fontSize: 20, fontWeight: '800', color: '#2c3e50', textAlign: 'center', marginBottom: 8 },
  successSubtitle: { fontSize: 14, color: '#7f8c8d', textAlign: 'center', marginBottom: 18, paddingHorizontal: 10, lineHeight: 20 },
  overlayPrimaryBtn: { alignSelf: 'stretch', borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#667eea' },
  overlayPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});

export default DoctorDoctorRequestsScreen;
