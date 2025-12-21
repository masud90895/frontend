/**
 * @type: formElement
 * name: form.element.Datetime
 * chunkName: datePicker
 */

import { Box, styled, TextField } from '@mui/material';
import { useField, useFormikContext } from 'formik';
import { camelCase } from 'lodash';
import moment, { Moment } from 'moment';
import React from 'react';
import { FormFieldProps } from '@metafox/form';
import ErrorMessage from '../ErrorMessage';
import TimeSuggestionPicker from './TimeSuggestionPicker';
import {
  LocalizationProvider,
  DatePicker,
  TimePicker
} from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import Description from '../Description';

const Root = styled('div', { name: 'DateTimePickerField' })(({ theme }) => ({
  padding: theme.spacing(2, 0, 1)
}));

const isSameDay = (start: Moment, end: Moment) => {
  if (!moment.isMoment(start) || !moment.isMoment(end)) return false;

  const startMoment = moment([start.year(), start.month(), start.date()]);
  const endMoment = moment([end.year(), end.month(), end.date()]);

  return !startMoment.diff(endMoment);
};

function DateTimePickerField({
  config,
  name,
  disabled: forceDisabled,
  required: forceRequired
}: FormFieldProps) {
  const {
    label,
    variant,
    margin,
    pickerVariant,
    disabled,
    component,
    value,
    required,
    inputFormat,
    formatValue,
    minDateTime,
    maxDateTime,
    timeSuggestion,
    labelDatePicker,
    labelTimePicker,
    nullable,
    timeFormat,
    description,
    ...restConfig
  } = config;
  const [field, meta, { setValue, setTouched }] = useField(name ?? 'datetime');
  const formik = useFormikContext();

  // Always derive value from Formik
  const valueMoment = field.value ? moment(field.value) : null;

  // Handle date change (from picker or typing)
  const handleDateChange = (date: Moment | null) => {
    if (!date || !moment.isMoment(date) || !date.isValid()) {
      setValue(nullable ? null : '');

      return;
    }

    // If time is set, preserve it
    let newDateTime = date.clone();

    if (valueMoment && valueMoment.isValid()) {
      newDateTime = newDateTime
        .hour(valueMoment.hour())
        .minute(valueMoment.minute())
        .second(0)
        .millisecond(0);
    }

    setTimeout(() => {
      setValue(newDateTime.toISOString());
    }, 0);
  };

  // Handle time change
  const handleTimeChange = (time: Moment | null) => {
    if (!time || !moment.isMoment(time) || !time.isValid()) {
      setValue(nullable ? null : '');

      return;
    }

    // If date is set, preserve it
    let newDateTime = time.clone();

    if (valueMoment && valueMoment.isValid()) {
      newDateTime = valueMoment
        .clone()
        .hour(time.hour())
        .minute(time.minute())
        .second(0)
        .millisecond(0);
    }

    setValue(newDateTime.toISOString());
  };

  // Handle blur for manual input
  const handleDateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
  };

  const haveError = Boolean(
    formik?.errors[name] && (meta.touched || formik.submitCount)
  );

  const hasMinTime =
    valueMoment && minDateTime && isSameDay(valueMoment, moment(minDateTime));
  const hasMaxTime =
    valueMoment && maxDateTime && isSameDay(valueMoment, moment(maxDateTime));

  return (
    <Root data-testid={camelCase(`field ${name}`)}>
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <Box sx={{ display: 'flex' }}>
          <Box
            sx={{
              '& input::placeholder': {
                color: theme => theme.palette.text.hint
              }
            }}
          >
            <DatePicker
              value={valueMoment}
              onChange={handleDateChange}
              label={labelDatePicker || label}
              minDate={minDateTime ? moment(minDateTime) : undefined}
              maxDate={maxDateTime ? moment(maxDateTime) : undefined}
              disabled={disabled || forceDisabled || formik.isSubmitting}
              dayOfWeekFormatter={(day: Moment) => day.format('ddd')}
              slotProps={{
                textField: {
                  error: haveError,
                  required: required || forceRequired,
                  autoComplete: 'off',
                  onBlur: handleDateBlur,
                  inputProps: {
                    'data-testid': camelCase(`inputDate ${name}`)
                  }
                }
              }}
              {...restConfig}
            />
          </Box>
          <Box data-testid={camelCase('timePicker')} sx={{ paddingLeft: 2 }}>
            {timeSuggestion ? (
              <TimeSuggestionPicker
                {...config}
                hasMinTime={hasMinTime}
                hasMaxTime={hasMaxTime}
                value={valueMoment}
                handleChange={handleTimeChange}
                disabled={disabled || forceDisabled || formik.isSubmitting}
                timeFormat={timeFormat}
                error={haveError}
                required={required || forceRequired}
                setTouched={setTouched}
                name={name}
              />
            ) : (
              <TimePicker
                {...restConfig}
                ampmInClock
                minTime={hasMinTime ? moment(minDateTime) : undefined}
                maxTime={hasMaxTime ? moment(maxDateTime) : undefined}
                minutesStep={1}
                disabled={disabled || forceDisabled || formik.isSubmitting}
                label={labelTimePicker || label}
                value={valueMoment}
                onChange={handleTimeChange}
                onClose={() => setTouched(true)}
                renderInput={params => (
                  <TextField
                    {...params}
                    required={required || forceRequired}
                    autoComplete="off"
                    error={haveError}
                    onBlur={() => setTouched(true)}
                    inputProps={{
                      ...params?.inputProps,
                      'data-testid': camelCase(`inputTime ${name}`)
                    }}
                  />
                )}
              />
            )}
          </Box>
        </Box>
        {description && <Description text={description} />}
      </LocalizationProvider>
      {haveError ? <ErrorMessage error={meta.error} /> : null}
    </Root>
  );
}

export default DateTimePickerField;
