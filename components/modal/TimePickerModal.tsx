import React, { useEffect, useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import TimePicker from '../common/TimePicker';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (hour: number, minute: number) => void;
  initialHour?: number;
  initialMinute?: number;
  title?: string;
}

const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialHour = 12,
  initialMinute = 0,
  title = 'Set Time',
}) => {
  const [selectedTime, setSelectedTime] = useState({
    hour: initialHour,
    minute: initialMinute,
  });

  // Update selected time when modal opens with new initial values
  useEffect(() => {
    if (visible) {
      setSelectedTime({ hour: initialHour, minute: initialMinute });
    }
  }, [visible, initialHour, initialMinute]);

  const handleConfirm = () => {
    onConfirm(selectedTime.hour, selectedTime.minute);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleCancel}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.modal}>
          <Text style={styles.title}>{title}</Text>

          <TimePicker
            initialHour={selectedTime.hour}
            initialMinute={selectedTime.minute}
            onChange={(hour, minute) => setSelectedTime({ hour, minute })}
          />

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.buttonCancel} onPress={handleCancel}>
              <Text style={styles.buttonCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonConfirm} onPress={handleConfirm}>
              <Text style={styles.buttonConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableWithoutFeedback onPress={handleCancel}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    width: '100%',
  },
  modal: {
    backgroundColor: '#FAFAFA',
    borderRadius: 24,
    padding: 24,
    width: 300,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 24,
  },
  buttonCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  buttonCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  buttonConfirm: {
    flex: 1,
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FAFAFA',
  },
});

export default TimePickerModal;