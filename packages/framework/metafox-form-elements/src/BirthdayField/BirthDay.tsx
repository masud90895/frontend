import { FormFieldProps } from '@metafox/form';
import { Box } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { useField } from 'formik';
import { camelCase } from 'lodash';
import moment, { Moment } from 'moment';
import React from 'react';
import useStyles from './styles';
import ErrorMessage from '../ErrorMessage';

function BirthDay({
  config,
  name,
  formik,
  disabled: forceDisabled
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
    valueFormat = 'YYYY-MM-DD',
    viewFormat = 'L',
    emptyValue,
    ...restConfig
  } = config;

  const classes = useStyles();
  const [field, meta, { setValue, setTouched }] = useField(name ?? 'birthday');
  const [selectedDate, setDate] = React.useState(
    field.value ? moment(field.value) : emptyValue
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
    <Box className={classes.root} data-testid={camelCase(`field ${name}`)}>
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
              required,
              autoComplete: 'off',
              onBlur: handleInputBlur,
              inputProps: {
                'data-testid': camelCase(`inputDate ${name}`)
              }
            }
          }}
          {...restConfig}
        />
        {haveError ? <ErrorMessage error={meta.error} /> : null}
      </LocalizationProvider>
    </Box>
  );
}

export default BirthDay;
