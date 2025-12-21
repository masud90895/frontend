/**
 * @type: formElement
 * name: form.element.DateBasic
 * chunkName: datePicker
 */

import { FormFieldProps } from '@metafox/form';
import { FormControl } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { useField } from 'formik';
import { camelCase } from 'lodash';
import moment, { Moment } from 'moment';
import React from 'react';
import { styled } from '@mui/material/styles';
import ErrorMessage from '../ErrorMessage';

const FormControlStyled = styled(FormControl, {
  name: 'FormControl'
})(({ theme }) => ({
  '& .iconCalendar': {
    fontSize: theme.mixins.pxToRem(20)
  }
}));

function DateBasic({
  config,
  name,
  formik,
  disabled: forceDisabled,
  required: forceRequired
}: FormFieldProps) {
  const {
    label,
    variant,
    margin,
    pickerVariant,
    component,
    value,
    required,
    minDate,
    maxDate,
    disabled,
    valueFormat = 'DD/MM/YYYY',
    viewFormat = 'L',
    size,
    sx,
    fullWidth,
    sxFieldWrapper,
    hiddenLabel,
    emptyValue,
    ...restConfig
  } = config;

  const [field, meta, { setValue, setTouched }] = useField(name ?? 'datebasic');
  const [selectedDate, setDate] = React.useState(
    field.value ? moment(field.value, valueFormat) : emptyValue
  );

  const handleDateChange = (date: any) => {
    const isValid = date?.isValid();
    setDate(isValid ? date : date);
  };

  const handleInputBlur = () => {
    setTouched(true);
  };

  React.useEffect(() => {
    const isValid = selectedDate?.isValid();

    if (!isValid) {
      setValue(selectedDate);

      return;
    }

    const newDateTime = selectedDate?.format(valueFormat);

    setValue(newDateTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const haveError = Boolean(meta.error && (meta.touched || formik.submitCount));

  return (
    <FormControlStyled
      margin={margin ?? 'normal'}
      disabled={disabled}
      fullWidth={fullWidth}
      hiddenLabel={hiddenLabel}
      required={required || forceRequired}
      sx={sxFieldWrapper}
      error={haveError}
      size={size}
      variant={variant as any}
      data-testid={camelCase(`field ${name}`)}
    >
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <DatePicker
          sx={{
            '& input::placeholder': {
              color: theme => theme.palette.text.hint
            }
          }}
          disabled={disabled || forceDisabled || formik.isSubmitting}
          value={selectedDate}
          format={viewFormat}
          onChange={handleDateChange}
          label={label}
          minDate={minDate ? moment(minDate) : undefined}
          maxDate={maxDate ? moment(maxDate) : undefined}
          dayOfWeekFormatter={(day: Moment) => day.format('ddd')}
          slotProps={{
            textField: {
              error: haveError,
              required: required || forceRequired,
              autoComplete: 'off',
              onBlur: handleInputBlur,
              inputProps: {
                'data-testid': camelCase(`input ${name}`)
              }
            }
          }}
          {...restConfig}
        />
        {haveError ? <ErrorMessage error={meta.error} /> : null}
      </LocalizationProvider>
    </FormControlStyled>
  );
}

export default DateBasic;
