/**
 * @type: formElement
 * name: form.element.Date
 * chunkName: datePicker
 */

import { FormFieldProps } from '@metafox/form';
import { FormControl } from '@mui/material';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { useField } from 'formik';
import { camelCase } from 'lodash';
import moment from 'moment';
import React from 'react';
import ErrorMessage from '../ErrorMessage';
import useStyles from './styles';

function DatePickerField({
  config,
  name,
  disabled: forceDisabled,
  formik,
  required: forceRequired
}: FormFieldProps) {
  const {
    label,
    component,
    variant,
    disabled,
    pickerVariant,
    placeholder,
    startOfDay: _start,
    endOfDay: _end,
    minDate,
    maxDate,
    sxFieldWrapper,
    size,
    views = ['year', 'day'],
    required,
    ...restConfig
  } = config;

  const classes = useStyles();

  const [field, meta, { setValue, setTouched }] = useField(name ?? 'date');
  const haveError = Boolean(meta.error && (meta.touched || formik.submitCount));

  const handleDateChange = (date: moment.Moment | null) => {
    const text = date;

    if (!moment.isMoment(date)) {
      date = moment(date);
    }

    setTouched(true);

    const isValidDate = date.isValid();

    if (isValidDate) {
      if (date && _start) {
        date = date.startOf('day');
      } else if (date && _end) {
        date = date.endOf('day');
      }

      setValue(date ? date.toISOString() : undefined);
    } else {
      setValue(text);
    }
  };

  const onBlurPicker = () => {
    setTouched(true);
  };

  return (
    <FormControl
      margin="dense"
      className={classes.root}
      data-testid={camelCase(`button ${name}`)}
      sx={sxFieldWrapper}
      size={size}
    >
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <DatePicker
          sx={{
            '& input::placeholder': {
              color: theme => theme.palette.text.hint
            }
          }}
          views={views}
          value={field.value ? moment(field.value) : null}
          onChange={handleDateChange}
          label={label}
          minDate={minDate ? moment(minDate) : null}
          maxDate={maxDate ? moment(maxDate) : null}
          disabled={disabled || forceDisabled || formik.isSubmitting}
          dayOfWeekFormatter={(_day: moment.Moment) => _day.format('ddd')}
          slotProps={{
            textField: {
              error: haveError,
              required: required || forceRequired,
              autoComplete: 'off',
              onBlur: onBlurPicker,
              size,
              inputProps: {
                'data-testid': camelCase(`inputDate ${name}`)
              }
            }
          }}
          {...restConfig}
        />
      </LocalizationProvider>
      {haveError ? <ErrorMessage error={meta.error} /> : null}
    </FormControl>
  );
}

export default DatePickerField;
